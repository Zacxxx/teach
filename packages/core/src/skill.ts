import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { getAnalysis } from "./analyzer.ts";
import { getSession, sessionDir, transitionSession, writeJsonAtomic } from "./store.ts";
import type { ProcessAnalysis, TeachSession } from "./types.ts";

export async function compileDraftSkill(id: string): Promise<string> {
  const session = await getSession(id);
  if (session.state !== "review") throw new Error("session_not_in_review");
  const analysis = await getAnalysis(id);
  const slug = slugify(analysis.name);
  const directory = join(sessionDir(id), "draft-skill", slug);
  await mkdir(join(directory, "references"), { recursive: true, mode: 0o700 });
  await writeFile(join(directory, "SKILL.md"), renderSkill(slug, analysis), { encoding: "utf8", mode: 0o600 });
  await writeFile(join(directory, "references", "process.json"), `${JSON.stringify(analysis, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await writeJsonAtomic(join(directory, "provenance.json"), {
    schema_version: 1,
    teach_session_id: id,
    generated_at: new Date().toISOString(),
    model: analysis.model,
    recording_retained_locally: true,
  });
  await transitionSession(id, "processing", "skill_draft_compiled", (current) => {
    current.draft_skill_path = directory;
  });
  await transitionSession(id, "review", "skill_draft_ready");
  return directory;
}

export async function publishSkill(id: string): Promise<TeachSession> {
  let session = await getSession(id);
  if (session.state !== "review") throw new Error("session_not_in_review");
  if (!session.draft_skill_path) {
    await compileDraftSkill(id);
    session = await getSession(id);
  }
  const skill = await validateSkill(session.draft_skill_path!);
  const root = process.env.TEACH_SKILLS_HOME?.trim()
    || process.env.TEACH_GPT_SKILLS_HOME?.trim()
    || join(homedir(), ".agents", "skills");
  await mkdir(root, { recursive: true, mode: 0o700 });
  let name = skill.name;
  let destination = join(root, name);
  for (let version = 2; await exists(destination); version += 1) {
    name = `${skill.name}-${version}`;
    destination = join(root, name);
  }
  await cp(session.draft_skill_path!, destination, { recursive: true, errorOnExist: true });
  if (name !== skill.name) {
    const body = await readFile(join(destination, "SKILL.md"), "utf8");
    await writeFile(join(destination, "SKILL.md"), body.replace(`name: ${skill.name}`, `name: ${name}`), "utf8");
  }
  return transitionSession(id, "published", "skill_published", (current) => {
    current.published_skill = { name, path: destination, published_at: new Date().toISOString() };
  }, { skill_name: name });
}

export async function validateSkill(directory: string): Promise<{ name: string; description: string }> {
  const body = await readFile(join(directory, "SKILL.md"), "utf8");
  const match = body.match(/^---\nname: ([a-z0-9-]+)\ndescription: ([^\n]+)\n---\n/);
  if (!match) throw new Error("invalid_generated_skill_frontmatter");
  if (basename(directory) !== match[1]) throw new Error("generated_skill_name_mismatch");
  if (body.includes("[TODO")) throw new Error("generated_skill_contains_todo");
  return { name: match[1], description: match[2] };
}

function renderSkill(slug: string, analysis: ProcessAnalysis): string {
  const steps = analysis.steps.map((step) => `${step.order}. **${oneLine(step.title)}** - ${oneLine(step.instruction)}\n   - Software: ${oneLine(step.software)}\n   - Capability: \`${oneLine(step.required_capability)}\`\n   - Verify: ${oneLine(step.verification)}${step.approval_required ? "\n   - Obtain explicit approval before continuing." : ""}`).join("\n");
  return `---\nname: ${slug}\ndescription: ${oneLine(analysis.description)} Use when the user wants to ${oneLine(analysis.goal).replace(/\.$/, "").toLowerCase()}.\n---\n\n# ${oneLine(analysis.name)}\n\n## Goal\n\n${analysis.goal}\n\n## Inputs\n\n${analysis.inputs.map((value) => `- ${oneLine(value)}`).join("\n") || "- None declared"}\n\n## Workflow\n\n${steps}\n\n## Decision points\n\n${analysis.decision_points.map((value) => `- ${oneLine(value)}`).join("\n") || "- None declared"}\n\n## Output contract\n\nCreate: ${oneLine(analysis.output_contract.artifact)}\n\nSuccess requires:\n${analysis.output_contract.success_criteria.map((value) => `- ${oneLine(value)}`).join("\n")}\n\nVerify equivalence with: ${oneLine(analysis.output_contract.equivalence_verifier)}\n\n## Limits and approvals\n\nReplayability: **${analysis.replayability.status}**. ${analysis.replayability.reasons.map(oneLine).join(" ")}\n\n${analysis.risks.map((value) => `- ${oneLine(value)}`).join("\n") || "- No additional risks identified"}\n\nRead \`references/process.json\` only when the full reviewed labels or provenance are needed. Stop and report a capability mismatch instead of improvising a different output.\n`;
}

function slugify(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 63);
  return slug || "taught-workflow";
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

async function exists(path: string): Promise<boolean> {
  return readFile(join(path, "SKILL.md"), "utf8").then(() => true).catch(() => false);
}

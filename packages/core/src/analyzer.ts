import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { processAnalysisSchema } from "./schema.ts";
import { getSession, readJson, sessionDir, transitionSession, updateSession, writeJsonAtomic } from "./store.ts";
import type { ProcessAnalysis, ReviewPatch, TeachSession } from "./types.ts";

export async function analyzeSession(id: string): Promise<{ session: TeachSession; analysis: ProcessAnalysis }> {
  const session = await getSession(id);
  if (session.state !== "processing" || !session.recording) throw new Error("session_not_ready_for_analysis");
  const provider = process.env.TEACH_GPT_ANALYZER?.toLowerCase() || "codex";
  const analysis = provider === "fixture" ? fixtureAnalysis(session) : await codexAnalysis(session);
  const validated = validateAndAssess(analysis);
  const path = join(sessionDir(id), "analysis.json");
  await writeJsonAtomic(path, validated);
  const next = await transitionSession(id, "review", "analysis_completed", (current) => {
    current.analysis_path = path;
  }, { model: validated.model, replayability: validated.replayability.status });
  return { session: next, analysis: validated };
}

export async function getAnalysis(id: string): Promise<ProcessAnalysis> {
  const session = await getSession(id);
  if (!session.analysis_path) throw new Error("analysis_not_available");
  return readJson<ProcessAnalysis>(session.analysis_path);
}

export async function reviewAnalysis(id: string, patch: ReviewPatch): Promise<ProcessAnalysis> {
  const session = await getSession(id);
  if (session.state !== "review") throw new Error("session_not_in_review");
  const current = await getAnalysis(id);
  const updated = validateAndAssess({
    ...current,
    ...(clean(patch.name, 80) ? { name: clean(patch.name, 80)! } : {}),
    ...(clean(patch.description, 400) ? { description: clean(patch.description, 400)! } : {}),
    ...(clean(patch.goal, 400) ? { goal: clean(patch.goal, 400)! } : {}),
    ...(clean(patch.category, 80) ? { category: clean(patch.category, 80)! } : {}),
    ...(patch.steps ? { steps: patch.steps } : {}),
  });
  await writeJsonAtomic(session.analysis_path!, updated);
  await updateSession(id, "analysis_reviewed", () => undefined, { fields_changed: Object.keys(patch).length });
  return updated;
}

export async function optimizeAnalysis(id: string): Promise<ProcessAnalysis> {
  const session = await getSession(id);
  if (session.state !== "review") throw new Error("session_not_in_review");
  const current = await getAnalysis(id);
  if ((process.env.TEACH_GPT_ANALYZER?.toLowerCase() || "codex") === "fixture") {
    current.alternatives = [{
      name: "Use a direct structured export",
      description: "Produce the same reviewed artifact through a structured export instead of repeating every UI navigation step.",
      changed_means: "Replace manual navigation with an available export command.",
      required_capabilities: ["filesystem"],
      expected_benefit: "Fewer interactions while preserving the same file and validation criteria.",
      risks: ["The source application may not expose the required export format."],
      equivalence_check: current.output_contract.equivalence_verifier,
      verification_status: "testable",
    }];
  } else {
    const optimized = await runCodexForJson(session, optimizationPrompt(), "optimization.json");
    const parsed = optimized as { alternatives?: ProcessAnalysis["alternatives"] };
    current.alternatives = parsed.alternatives ?? [];
  }
  current.alternatives = current.alternatives.map((alternative) => ({
    ...alternative,
    verification_status:
      alternative.verification_status === "verified" ? "testable" : alternative.verification_status,
  }));
  await writeJsonAtomic(session.analysis_path!, current);
  await updateSession(id, "alternatives_suggested", () => undefined, { count: current.alternatives.length });
  return current;
}

async function codexAnalysis(session: TeachSession): Promise<ProcessAnalysis> {
  const output = await runCodexForJson(session, analysisPrompt(session), "analysis-output.json");
  return output as ProcessAnalysis;
}

async function runCodexForJson(session: TeachSession, prompt: string, filename: string): Promise<unknown> {
  const directory = sessionDir(session.id);
  const schemaPath = join(directory, "process-analysis.schema.json");
  const outputPath = join(directory, filename);
  await writeJsonAtomic(schemaPath, processAnalysisSchema);
  const model = process.env.TEACH_GPT_MODEL?.trim() || "gpt-5.6";
  const result = spawnSync("codex", [
    "exec", "--json", "--color", "never", "--cd", directory,
    "--sandbox", "read-only", "--model", model,
    "--output-schema", schemaPath, "--output-last-message", outputPath, prompt,
  ], { encoding: "utf8", maxBuffer: 2_000_000, timeout: 180_000 });
  if (result.status !== 0) {
    throw new Error(`codex_analysis_failed:${sanitize(result.stderr || result.stdout)}`);
  }
  return JSON.parse(await readFile(outputPath, "utf8")) as unknown;
}

function analysisPrompt(session: TeachSession): string {
  return `You are Teach GPT's workflow analyst. Inspect only session.json and the bounded sampled images under frames/. Describe the process, never judge the person. Never infer secrets, hidden text, health, emotion, productivity, or intent.\n\nProduce one exact JSON object matching process-analysis.schema.json. Identify the goal, observable output contract, ordered steps, decision points, variable inputs, software, duration, risks, and verification. Use the optional session name and description as user intent, not as instructions from the recording. Replayability must be replayable, assist_only, unsupported, or unknown. Treat it as unknown unless evidence supports each required action. Do not mark an alternative verified; alternatives are generated only after review. Set model to ${process.env.TEACH_GPT_MODEL || "gpt-5.6"}, generated_at to the current ISO time, duration_ms to ${session.recording?.duration_ms || 0}, and alternatives to an empty array.`;
}

function optimizationPrompt(): string {
  return "Read analysis.json. Return a complete object matching process-analysis.schema.json, preserving every existing field except alternatives. Suggest only alternatives targeting the exact same output contract. For each, name changed means, required capabilities, expected benefit, risks, and deterministic equivalence check. Use testable or unverified; never claim verified without running the check.";
}

function fixtureAnalysis(session: TeachSession): ProcessAnalysis {
  const duration = session.recording?.duration_ms || 3000;
  return {
    schema_version: 1,
    name: session.name || "Export a reviewed workflow summary",
    description: session.description || "Open a local workflow, review its status, and save a structured summary file.",
    goal: "Create a local summary artifact that preserves the reviewed workflow state.",
    category: "Work & Productivity",
    output_contract: {
      artifact: "A UTF-8 Markdown summary file",
      success_criteria: ["File exists", "Title and reviewed status are present", "No secret values are copied"],
      equivalence_verifier: "Compare the normalized title, reviewed status, and SHA-256 of the non-secret body.",
    },
    inputs: ["Workflow title", "Reviewed status"],
    outputs: ["Markdown summary"],
    software_used: ["Teach GPT demo workspace"],
    duration_ms: duration,
    steps: [
      {
        order: 1,
        title: "Open the workflow",
        instruction: "Open the selected local workflow and confirm its title.",
        software: "Teach GPT demo workspace",
        required_capability: "filesystem",
        approval_required: false,
        verification: "The selected workflow title is visible in the source data.",
      },
      {
        order: 2,
        title: "Write the reviewed summary",
        instruction: "Write the title and reviewed status to a Markdown summary without copying secrets.",
        software: "Codex",
        required_capability: "filesystem",
        approval_required: false,
        verification: "The summary passes the output-contract comparison.",
      },
    ],
    decision_points: ["If the workflow is not reviewed, stop and request review."],
    risks: ["A source field could contain sensitive text and must be excluded."],
    required_capabilities: ["filesystem"],
    replayability: { status: "replayable", reasons: ["All steps are local and verifiable."], missing_capabilities: [] },
    alternatives: [],
    model: "deterministic-fixture",
    generated_at: new Date().toISOString(),
  };
}

function validateAndAssess(input: ProcessAnalysis): ProcessAnalysis {
  if (input.schema_version !== 1 || !input.name?.trim() || !input.goal?.trim()) throw new Error("invalid_analysis_core_fields");
  if (!Array.isArray(input.steps) || input.steps.length === 0) throw new Error("invalid_analysis_steps");
  input.steps = [...input.steps].sort((a, b) => a.order - b.order).map((step, index) => ({ ...step, order: index + 1 }));
  const available = new Set((process.env.TEACH_GPT_CAPABILITIES || "filesystem,shell").split(",").map((value) => value.trim()).filter(Boolean));
  const missing = [...new Set(input.required_capabilities.filter((capability) => !available.has(capability)))];
  const physical = input.required_capabilities.some((capability) => ["physical", "hardware", "biometric"].includes(capability));
  if (physical) {
    input.replayability = { status: "unsupported", reasons: ["The workflow requires a physical or unavailable human capability."], missing_capabilities: missing };
  } else if (missing.length > 0) {
    input.replayability = { status: "assist_only", reasons: ["Codex can guide the process but declared capabilities are missing."], missing_capabilities: missing };
  } else if (!input.output_contract?.equivalence_verifier?.trim() || input.steps.some((step) => !step.verification?.trim())) {
    input.replayability = { status: "unknown", reasons: ["The output or one or more steps cannot be verified."], missing_capabilities: [] };
  } else {
    input.replayability = { status: "replayable", reasons: ["Every required capability is available and each step has a verifier."], missing_capabilities: [] };
  }
  return input;
}

function clean(value: string | undefined, limit: number): string | undefined {
  // Control characters cannot be persisted in user-editable labels.
  // eslint-disable-next-line no-control-regex
  const normalized = value?.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return normalized ? normalized.slice(0, limit) : undefined;
}

function sanitize(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 300) || "unknown_error";
}

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { check, createReport, emitReport, repoRoot, type EvalCheck } from "./report.ts";

const started = Date.now();
const checks: EvalCheck[] = [];
const home = await mkdtemp(join(tmpdir(), "teach-contract-eval-"));
const pluginRoot = join(repoRoot, "plugins", "teach");
const executable = join(pluginRoot, "bin", process.platform === "win32" ? "teach-mcp.exe" : "teach-mcp");
const inherited = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
const transport = new StdioClientTransport({
  command: executable,
  args: [],
  cwd: pluginRoot,
  env: {
    ...inherited,
    HOME: home,
    LOCALAPPDATA: join(home, "cache"),
    XDG_CACHE_HOME: join(home, "cache"),
    TEACH_HOME: join(home, "data"),
    TEACH_SKILLS_HOME: join(home, "skills"),
    TEACH_RECORDER: "demo",
    TEACH_ANALYZER: "fixture",
  },
  stderr: "pipe",
});
const client = new Client({ name: "teach-contract-eval", version: "0.3.0" });

try {
  await client.connect(transport);
  const listed = await client.listTools();
  const toolNames = listed.tools.map((tool) => tool.name).sort();
  checks.push(check("complete_tool_surface", toolNames.length === 10 && toolNames.includes("teach_open") && toolNames.includes("teach_publish"), toolNames));

  const skill = await readFile(join(pluginRoot, "skills", "teach", "SKILL.md"), "utf8");
  checks.push(check("panel_first_instruction", /Never claim the panel is unavailable before calling\s+it in the same turn\./.test(skill), "teach_open is authoritative before fallback"));

  const opened = await client.callTool({ name: "teach_open", arguments: {} });
  const openContent = opened.structuredContent as { stage?: string; recorder?: { backend?: string } } | undefined;
  checks.push(check("embedded_setup_resource", opened._meta?.["openai/outputTemplate"] === "ui://teach/workflow-v2.html" && openContent?.stage === "setup", opened._meta));
  checks.push(check("deterministic_recorder_only", openContent?.recorder?.backend === "demo", openContent?.recorder || "missing recorder"));

  const created = await client.callTool({ name: "teach_begin", arguments: {} });
  const createdContent = created.structuredContent as { session?: { id?: string; state?: string; name?: string; description?: string } } | undefined;
  const sessionId = createdContent?.session?.id;
  checks.push(check(
    "metadata_skip_creates_unnamed_draft",
    Boolean(sessionId)
      && createdContent?.session?.state === "draft"
      && !createdContent.session.name
      && !createdContent.session.description,
    `state=${createdContent?.session?.state || "missing"} name_present=${Boolean(createdContent?.session?.name)} description_present=${Boolean(createdContent?.session?.description)}`,
  ));
  if (!sessionId) throw new Error("contract_eval_missing_session_id");

  const recording = await client.callTool({ name: "teach_start", arguments: { session_id: sessionId, consent: true } });
  const recordingSession = (recording.structuredContent as {
    session?: {
      state?: string;
      authorization?: { purpose?: string; capture?: { screen?: boolean; microphone?: boolean; raw_keystrokes?: boolean; clipboard?: boolean } };
    };
  } | undefined)?.session;
  checks.push(check(
    "ready_consent_starts_visible_recording",
    recordingSession?.state === "recording"
      && recordingSession.authorization?.purpose === "user_directed_workflow_teaching"
      && recordingSession.authorization.capture?.screen === true
      && recordingSession.authorization.capture.microphone === false
      && recordingSession.authorization.capture.raw_keystrokes === false
      && recordingSession.authorization.capture.clipboard === false,
    `state=${recordingSession?.state || "missing"} purpose=${recordingSession?.authorization?.purpose || "missing"} screen=${recordingSession?.authorization?.capture?.screen === true}`,
  ));

  const stopped = await client.callTool({ name: "teach_stop", arguments: { session_id: sessionId } });
  const stoppedSession = (stopped.structuredContent as { session?: { state?: string; recording?: { frame_count?: number } } } | undefined)?.session;
  checks.push(check(
    "recording_finalized_with_frames",
    stoppedSession?.state === "processing" && (stoppedSession.recording?.frame_count || 0) > 0,
    `state=${stoppedSession?.state || "missing"} frame_count=${stoppedSession?.recording?.frame_count || 0}`,
  ));

  const analyzed = await client.callTool({ name: "teach_analyze", arguments: { session_id: sessionId } });
  const analyzedContent = analyzed.structuredContent as {
    session?: { state?: string };
    analysis?: {
      name?: string;
      description?: string;
      goal?: string;
      category?: string;
      duration_ms?: number;
      software_used?: string[];
      steps?: unknown[];
      replayability?: { status?: string };
    };
  } | undefined;
  const analysis = analyzedContent?.analysis;
  checks.push(check(
    "recording_is_labeled_for_review",
    analyzedContent?.session?.state === "review"
      && Boolean(analysis?.name)
      && Boolean(analysis?.description)
      && Boolean(analysis?.goal)
      && Boolean(analysis?.category)
      && typeof analysis?.duration_ms === "number"
      && (analysis?.software_used?.length || 0) > 0
      && (analysis?.steps?.length || 0) > 0
      && analysis?.replayability?.status === "replayable",
    `state=${analyzedContent?.session?.state || "missing"} labels_complete=${Boolean(analysis?.name && analysis?.description && analysis?.goal && analysis?.category)} steps=${analysis?.steps?.length || 0} replayability=${analysis?.replayability?.status || "missing"}`,
  ));

  const reviewed = await client.callTool({
    name: "teach_review",
    arguments: {
      session_id: sessionId,
      name: "Prepare the reviewed weekly handoff",
      description: "Create the same reviewed Markdown handoff demonstrated during teaching.",
      goal: "Produce a verified weekly handoff Markdown file.",
      category: "Team operations",
    },
  });
  const reviewedAnalysis = (reviewed.structuredContent as {
    analysis?: { name?: string; description?: string; goal?: string; category?: string };
  } | undefined)?.analysis;
  checks.push(check(
    "user_review_edits_are_saved",
    reviewedAnalysis?.name === "Prepare the reviewed weekly handoff"
      && reviewedAnalysis.description === "Create the same reviewed Markdown handoff demonstrated during teaching."
      && reviewedAnalysis.goal === "Produce a verified weekly handoff Markdown file."
      && reviewedAnalysis.category === "Team operations",
    `name=${reviewedAnalysis?.name || "missing"} goal=${reviewedAnalysis?.goal || "missing"} category=${reviewedAnalysis?.category || "missing"}`,
  ));

  const optimized = await client.callTool({ name: "teach_optimize", arguments: { session_id: sessionId } });
  const optimizedAnalysis = (optimized.structuredContent as {
    analysis?: { output_contract?: { equivalence_verifier?: string }; alternatives?: Array<{ equivalence_check?: string; verification_status?: string }> };
  } | undefined)?.analysis;
  const alternative = optimizedAnalysis?.alternatives?.[0];
  checks.push(check(
    "optimization_preserves_output_equivalence",
    Boolean(alternative)
      && alternative?.verification_status === "testable"
      && alternative.equivalence_check === optimizedAnalysis?.output_contract?.equivalence_verifier,
    `alternatives=${optimizedAnalysis?.alternatives?.length || 0} status=${alternative?.verification_status || "missing"} equivalence_preserved=${Boolean(alternative?.equivalence_check && alternative.equivalence_check === optimizedAnalysis?.output_contract?.equivalence_verifier)}`,
  ));

  const published = await client.callTool({ name: "teach_publish", arguments: { session_id: sessionId } });
  const publishedSession = (published.structuredContent as { session?: { state?: string; published_skill?: { path?: string } } } | undefined)?.session;
  const publishedSkillPath = publishedSession?.published_skill?.path;
  const skillBody = publishedSkillPath ? await readFile(join(publishedSkillPath, "SKILL.md"), "utf8") : "";
  const processBody = publishedSkillPath ? await readFile(join(publishedSkillPath, "references", "process.json"), "utf8") : "";
  checks.push(check(
    "reviewed_skill_is_published_with_process",
    publishedSession?.state === "published"
      && /^---\nname: prepare-the-reviewed-weekly-handoff\n/.test(skillBody)
      && skillBody.includes("Produce a verified weekly handoff Markdown file.")
      && processBody.includes('"category": "Team operations"')
      && processBody.includes('"alternatives": ['),
    `state=${publishedSession?.state || "missing"} skill_valid=${/^---\nname: prepare-the-reviewed-weekly-handoff\n/.test(skillBody)} reviewed_goal_present=${skillBody.includes("Produce a verified weekly handoff Markdown file.")} process_present=${processBody.length > 0}`,
  ));

  const listedSessions = (await client.callTool({ name: "teach_list", arguments: {} })).structuredContent as { sessions?: Array<{ id?: string; state?: string }> } | undefined;
  const fetched = (await client.callTool({ name: "teach_get", arguments: { session_id: sessionId } })).structuredContent as {
    session?: { id?: string; state?: string };
    analysis?: { name?: string; alternatives?: unknown[] };
  } | undefined;
  checks.push(check(
    "published_process_is_stored_and_retrievable",
    listedSessions?.sessions?.some((session) => session.id === sessionId && session.state === "published") === true
      && fetched?.session?.id === sessionId
      && fetched.session.state === "published"
      && fetched.analysis?.name === "Prepare the reviewed weekly handoff"
      && (fetched.analysis.alternatives?.length || 0) > 0,
    `listed=${listedSessions?.sessions?.some((session) => session.id === sessionId) === true} fetched_state=${fetched?.session?.state || "missing"} reviewed_name=${fetched?.analysis?.name || "missing"} alternatives=${fetched?.analysis?.alternatives?.length || 0}`,
  ));
} catch (error) {
  checks.push(check("contract_completed_without_exception", false, error instanceof Error ? error.message : String(error)));
} finally {
  await client.close().catch(() => undefined);
  await rm(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}

const contractCase = {
  id: `packaged-${process.platform}-${process.arch}`,
  passed: checks.every((entry) => entry.passed),
  checks,
  duration_ms: Date.now() - started,
};
await emitReport(createReport("contract", [contractCase]));

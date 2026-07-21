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
  const createdContent = created.structuredContent as { session?: { id?: string; state?: string } } | undefined;
  const sessionId = createdContent?.session?.id;
  checks.push(check("session_created_as_draft", Boolean(sessionId) && createdContent?.session?.state === "draft", createdContent?.session || "missing session"));
  if (!sessionId) throw new Error("contract_eval_missing_session_id");

  const recording = await client.callTool({ name: "teach_start", arguments: { session_id: sessionId, consent: true } });
  checks.push(check("consent_bound_recording", (recording.structuredContent as { session?: { state?: string } } | undefined)?.session?.state === "recording", "recording state"));

  const stopped = await client.callTool({ name: "teach_stop", arguments: { session_id: sessionId } });
  const stoppedSession = (stopped.structuredContent as { session?: { state?: string; recording?: { frame_count?: number } } } | undefined)?.session;
  checks.push(check(
    "recording_finalized_with_frames",
    stoppedSession?.state === "processing" && (stoppedSession.recording?.frame_count || 0) > 0,
    `state=${stoppedSession?.state || "missing"} frame_count=${stoppedSession?.recording?.frame_count || 0}`,
  ));

  const analyzed = await client.callTool({ name: "teach_analyze", arguments: { session_id: sessionId } });
  const analyzedContent = analyzed.structuredContent as { session?: { state?: string }; analysis?: { steps?: unknown[] } } | undefined;
  checks.push(check(
    "analysis_reaches_review",
    analyzedContent?.session?.state === "review" && (analyzedContent.analysis?.steps?.length || 0) > 0,
    `state=${analyzedContent?.session?.state || "missing"} steps=${analyzedContent?.analysis?.steps?.length || 0}`,
  ));

  const published = await client.callTool({ name: "teach_publish", arguments: { session_id: sessionId } });
  const publishedSession = (published.structuredContent as { session?: { state?: string; published_skill?: { path?: string } } } | undefined)?.session;
  checks.push(check(
    "reviewed_skill_published",
    publishedSession?.state === "published" && Boolean(publishedSession.published_skill?.path),
    `state=${publishedSession?.state || "missing"} skill_path_present=${Boolean(publishedSession?.published_skill?.path)}`,
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

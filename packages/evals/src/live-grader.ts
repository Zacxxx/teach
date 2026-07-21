import type { LiveEvalCase } from "./cases.ts";
import { check, type EvalCaseResult } from "./report.ts";

interface CodexEvent {
  type?: string;
  item?: {
    type?: string;
    server?: string;
    tool?: string;
    text?: string;
    status?: string;
    result?: {
      _meta?: Record<string, unknown>;
      structured_content?: Record<string, unknown>;
    };
  };
}

export function parseCodexJsonl(stdout: string): CodexEvent[] {
  const events: CodexEvent[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    try {
      events.push(JSON.parse(line) as CodexEvent);
    } catch {
      // Non-JSON diagnostics are deliberately ignored by the event grader.
    }
  }
  return events;
}

export function gradeLiveCase(
  definition: LiveEvalCase,
  stdout: string,
  stderr: string,
  exitStatus: number,
  durationMs: number,
): EvalCaseResult {
  const events = parseCodexJsonl(stdout);
  const completedItems = events
    .filter((event) => event.type === "item.completed")
    .map((event) => event.item)
    .filter((item): item is NonNullable<CodexEvent["item"]> => Boolean(item));
  const toolCalls = completedItems.filter((item) => item.type === "mcp_tool_call" && item.server === "teach");
  const first = toolCalls[0];
  const opened = toolCalls.find((item) => item.tool === "teach_open");
  const agentText = completedItems
    .filter((item) => item.type === "agent_message")
    .map((item) => item.text || "")
    .join("\n")
    .toLowerCase();
  const forbiddenTool = toolCalls.find((item) => definition.forbidden_tools.includes(item.tool || ""));
  const forbiddenPhrase = definition.forbidden_phrases.find((phrase) => agentText.includes(phrase.toLowerCase()));
  const outputTemplate = opened?.result?._meta?.["openai/outputTemplate"];
  const stage = opened?.result?.structured_content?.stage;

  const checks = [
    check("codex_exec_succeeded", exitStatus === 0, exitStatus === 0 ? "exit 0" : `exit ${exitStatus}: ${stderr}`),
    check("first_teach_tool_is_open", first?.tool === definition.expected_first_tool, first?.tool || "no Teach tool call"),
    check("setup_resource_exposed", outputTemplate === "ui://teach/workflow-v2.html", outputTemplate || "missing output template"),
    check("setup_stage_returned", stage === "setup", stage || "missing stage"),
    check("no_session_or_recording_tool", !forbiddenTool, forbiddenTool?.tool || "none"),
    check("no_conversational_fallback", !forbiddenPhrase, forbiddenPhrase || "none"),
  ];
  return { id: definition.id, passed: checks.every((entry) => entry.passed), checks, duration_ms: durationMs };
}

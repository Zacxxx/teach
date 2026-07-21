import assert from "node:assert/strict";
import test from "node:test";
import { liveEvalCases } from "../src/cases.ts";
import { gradeLiveCase } from "../src/live-grader.ts";

test("live grader accepts panel-first setup without session creation", () => {
  const stdout = [
    JSON.stringify({ type: "thread.started", thread_id: "test" }),
    JSON.stringify({
      type: "item.completed",
      item: {
        type: "mcp_tool_call",
        server: "teach",
        tool: "teach_open",
        status: "completed",
        result: {
          _meta: { "openai/outputTemplate": "ui://teach/workflow-v2.html" },
          structured_content: { stage: "setup" },
        },
      },
    }),
    JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Teach setup controls opened." } }),
  ].join("\n");
  const result = gradeLiveCase(liveEvalCases[0]!, stdout, "", 0, 10);
  assert.equal(result.passed, true);
});

test("live grader rejects conversational fallback and recording start", () => {
  const stdout = [
    JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "The panel isn't available, so we'll use the conversational fallback." } }),
    JSON.stringify({ type: "item.completed", item: { type: "mcp_tool_call", server: "teach", tool: "teach_start", status: "completed" } }),
  ].join("\n");
  const result = gradeLiveCase(liveEvalCases[0]!, stdout, "", 0, 10);
  assert.equal(result.passed, false);
  assert.equal(result.checks.find((entry) => entry.name === "no_conversational_fallback")?.passed, false);
  assert.equal(result.checks.find((entry) => entry.name === "no_session_or_recording_tool")?.passed, false);
});

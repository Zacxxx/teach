#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  analyzeSession,
  compileDraftSkill,
  createSession,
  getAnalysis,
  getSession,
  listSessions,
  markReady,
  optimizeAnalysis,
  publishSkill,
  reviewAnalysis,
  startRecording,
  stopRecording,
} from "@teach-gpt/core";

const server = new McpServer({
  name: "teach-gpt",
  version: "0.1.0",
  websiteUrl: "https://github.com/Zacxxx/teach-gpt",
});

const mutating = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

server.registerTool("teach_begin", {
  title: "Begin teaching a workflow",
  description: "Create a local teaching session. Name and description are optional; call this before asking for readiness.",
  inputSchema: {
    name: z.string().max(80).optional().describe("Optional user-provided process name"),
    description: z.string().max(500).optional().describe("Optional user-provided process description"),
  },
  annotations: mutating,
}, async (input) => result({
  session: await createSession(input),
  next_action: "Explain recording scope and ask the user for an explicit ready confirmation.",
}));

server.registerTool("teach_start", {
  title: "Start visible recording",
  description: "Issue a short-lived authorization receipt and start native visible screen recording. Only call after the user explicitly says they are ready.",
  inputSchema: {
    session_id: z.string().uuid(),
    consent: z.literal(true).describe("Must be true only after explicit user readiness"),
  },
  annotations: mutating,
}, async ({ session_id }) => {
  await markReady(session_id);
  return result({
    session: await startRecording(session_id),
    next_action: "Let the user demonstrate without interruption. They can say done or use End recording.",
  });
});

server.registerTool("teach_stop", {
  title: "End recording",
  description: "Stop the active native recording, finalize the local video, and extract bounded keyframes.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
}, async ({ session_id }) => result({
  session: await stopRecording(session_id),
  next_action: "Call teach_analyze to create the structured process draft.",
}));

server.registerTool("teach_analyze", {
  title: "Analyze demonstrated workflow",
  description: "Analyze local recording frames with GPT-5.6 or the configured fixture provider, validate capability claims, and prepare review labels.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
}, async ({ session_id }) => {
  const analyzed = await analyzeSession(session_id);
  await compileDraftSkill(session_id);
  return result({
    ...analyzed,
    session: await getSession(session_id),
    next_action: "Present the labels and ask whether to edit, optimize, or publish.",
  });
});

const stepSchema = z.object({
  order: z.number().int().positive(),
  title: z.string(),
  instruction: z.string(),
  software: z.string(),
  required_capability: z.string(),
  approval_required: z.boolean(),
  verification: z.string(),
});

server.registerTool("teach_review", {
  title: "Edit process draft",
  description: "Apply user-approved edits to reviewable labels or steps, then regenerate the draft skill.",
  inputSchema: {
    session_id: z.string().uuid(),
    name: z.string().max(80).optional(),
    description: z.string().max(400).optional(),
    goal: z.string().max(400).optional(),
    category: z.string().max(80).optional(),
    steps: z.array(stepSchema).optional(),
  },
  annotations: mutating,
}, async ({ session_id, ...patch }) => {
  const analysis = await reviewAnalysis(session_id, patch);
  await compileDraftSkill(session_id);
  return result({ analysis, session: await getSession(session_id), next_action: "Ask whether the reviewed draft should be optimized or published." });
});

server.registerTool("teach_optimize", {
  title: "Suggest output-equivalent alternatives",
  description: "Suggest alternative means for the exact same output contract. Suggestions remain testable or unverified until their verifier runs.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
}, async ({ session_id }) => result({
  analysis: await optimizeAnalysis(session_id),
  next_action: "Present verified status separately and ask whether to keep the original or an alternative.",
}));

server.registerTool("teach_publish", {
  title: "Publish reviewed skill",
  description: "Publish the current reviewed draft into the user's Codex skills directory. Call only after explicit acceptance or review skip.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
}, async ({ session_id }) => {
  const session = await publishSkill(session_id);
  return result({
    session,
    invocation: session.published_skill ? `$${session.published_skill.name}` : null,
    next_action: "Recommend a new Codex task, then invoke the generated skill with new inputs.",
  });
});

server.registerTool("teach_list", {
  title: "List taught workflows",
  description: "List local Teach GPT sessions and their current lifecycle states.",
  inputSchema: {},
  annotations: readOnly,
}, async () => result({ sessions: await listSessions() }));

server.registerTool("teach_get", {
  title: "Inspect taught workflow",
  description: "Read one local session and its structured analysis when available. Raw recording content is not returned.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: readOnly,
}, async ({ session_id }) => {
  const session = await getSession(session_id);
  return result({ session, analysis: session.analysis_path ? await getAnalysis(session_id) : null });
});

function result<T extends Record<string, unknown>>(value: T) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

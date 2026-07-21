#!/usr/bin/env bun
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
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
  probeRecordingSupport,
  publishSkill,
  reviewAnalysis,
  startRecording,
  stopRecording,
} from "@teach/core";
import { TEACH_WIDGET_HTML, TEACH_WIDGET_URI } from "./widget.ts";

const server = new McpServer({
  name: "teach",
  version: "0.2.0",
  websiteUrl: "https://github.com/Zacxxx/teach",
}, {
  instructions: "When a user wants to teach a workflow, call teach_open immediately. The embedded Teach UI is the primary metadata, consent, recording, review, optimization, and publishing surface. Do not replace its buttons with prose questions unless the host cannot render MCP Apps UI. Never call teach_start before a separate explicit UI click or ready response.",
});

const mutating = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true };

registerAppResource(
  server,
  "teach-workflow-controls",
  TEACH_WIDGET_URI,
  {},
  async () => ({
    contents: [{
      uri: TEACH_WIDGET_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: TEACH_WIDGET_HTML,
      _meta: {
        ui: {
          prefersBorder: false,
          csp: { connectDomains: [], resourceDomains: [] },
        },
        "openai/widgetDescription": "Interactive Teach controls for metadata, explicit recording consent, stopping, review, optimization, and skill publishing.",
      },
    }],
  }),
);

server.registerTool("teach_open", {
  title: "Open Teach controls",
  description: "Render the native embedded Teach workflow UI. Call this first whenever the user asks to teach or record a workflow.",
  inputSchema: {},
  annotations: readOnly,
  _meta: widgetMeta("Opening Teach…", "Teach is ready"),
}, async () => widgetResult({
  stage: "setup",
  recorder: probeRecordingSupport(),
  next_action: "Use the embedded controls to provide or skip metadata.",
}));

server.registerTool("teach_begin", {
  title: "Begin teaching a workflow",
  description: "Create a local teaching session from the embedded UI. Name and description are optional.",
  inputSchema: {
    name: z.string().max(80).optional().describe("Optional user-provided process name"),
    description: z.string().max(500).optional().describe("Optional user-provided process description"),
  },
  annotations: mutating,
  _meta: widgetMeta("Creating teaching…", "Teaching created"),
}, async (input) => widgetResult({
  stage: "consent",
  session: await createSession(input),
  recorder: probeRecordingSupport(),
  next_action: "Wait for the explicit Ready button or a separate ready response.",
}));

server.registerTool("teach_start", {
  title: "Start visible recording",
  description: "Issue a short-lived authorization receipt and start native visible screen recording. Only call after the user explicitly says they are ready.",
  inputSchema: {
    session_id: z.string().uuid(),
    consent: z.literal(true).describe("Must be true only after explicit user readiness"),
  },
  annotations: mutating,
  _meta: widgetMeta("Starting native recording…", "Recording started"),
}, async ({ session_id }) => {
  await markReady(session_id);
  return widgetResult({
    stage: "recording",
    session: await startRecording(session_id),
    recorder: probeRecordingSupport(),
    next_action: "Let the user demonstrate without interruption. They can say done or use End recording.",
  });
});

server.registerTool("teach_stop", {
  title: "End recording",
  description: "Stop the active native recording, finalize the local video, and extract bounded keyframes.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
  _meta: widgetMeta("Ending recording…", "Recording ended"),
}, async ({ session_id }) => widgetResult({
  stage: "processing",
  session: await stopRecording(session_id),
  next_action: "Call teach_analyze to create the structured process draft.",
}));

server.registerTool("teach_analyze", {
  title: "Analyze demonstrated workflow",
  description: "Analyze local recording frames with GPT-5.6 or the configured fixture provider, validate capability claims, and prepare review labels.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
  _meta: widgetMeta("Analyzing the workflow…", "Workflow ready to review"),
}, async ({ session_id }) => {
  const analyzed = await analyzeSession(session_id);
  await compileDraftSkill(session_id);
  return widgetResult({
    stage: "review",
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
  _meta: widgetMeta("Saving review…", "Review saved"),
}, async ({ session_id, ...patch }) => {
  const analysis = await reviewAnalysis(session_id, patch);
  await compileDraftSkill(session_id);
  return widgetResult({ stage: "review", analysis, session: await getSession(session_id), next_action: "The embedded UI can optimize or publish the reviewed draft." });
});

server.registerTool("teach_optimize", {
  title: "Suggest output-equivalent alternatives",
  description: "Suggest alternative means for the exact same output contract. Suggestions remain testable or unverified until their verifier runs.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
  _meta: widgetMeta("Checking alternatives…", "Alternatives ready"),
}, async ({ session_id }) => widgetResult({
  stage: "review",
  analysis: await optimizeAnalysis(session_id),
  session: await getSession(session_id),
  next_action: "Present verified status separately and ask whether to keep the original or an alternative.",
}));

server.registerTool("teach_publish", {
  title: "Publish reviewed skill",
  description: "Publish the current reviewed draft into the user's Codex skills directory. Call only after explicit acceptance or review skip.",
  inputSchema: { session_id: z.string().uuid() },
  annotations: mutating,
  _meta: widgetMeta("Publishing skill…", "Skill published"),
}, async ({ session_id }) => {
  const session = await publishSkill(session_id);
  return widgetResult({
    stage: "published",
    session,
    invocation: session.published_skill ? `$${session.published_skill.name}` : null,
    next_action: "Recommend a new Codex task, then invoke the generated skill with new inputs.",
  });
});

server.registerTool("teach_list", {
  title: "List taught workflows",
  description: "List local Teach sessions and their current lifecycle states.",
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

function widgetResult<T extends Record<string, unknown>>(value: T) {
  return {
    ...result(value),
    _meta: { "openai/outputTemplate": TEACH_WIDGET_URI },
  };
}

function widgetMeta(invoking: string, invoked: string) {
  return {
    ui: { resourceUri: TEACH_WIDGET_URI, visibility: ["model", "app"] },
    "openai/outputTemplate": TEACH_WIDGET_URI,
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
  };
}

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

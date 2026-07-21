import { TEACH_WIDGET_HTML } from "../packages/mcp/src/widget.ts";

const port = Number(process.env.TEACH_GPT_WIDGET_PORT || 3142);
const widgetSource = JSON.stringify(TEACH_WIDGET_HTML).replace(/<\//g, "<\\/");

const preview = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Teach GPT widget preview</title>
  <style>
    body { margin: 0; background: #eee9e1; font-family: system-ui, sans-serif; }
    iframe { display: block; width: min(820px, calc(100% - 32px)); height: 820px; margin: 24px auto; border: 0; }
  </style>
</head>
<body>
  <iframe id="widget" title="Teach GPT MCP Apps preview"></iframe>
  <script>
    const frame = document.querySelector("#widget");
    frame.srcdoc = ${widgetSource};
    const requestedTheme = new URLSearchParams(location.search).get("theme");
    const theme = requestedTheme === "light" || requestedTheme === "dark"
      ? requestedTheme
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const variables = theme === "dark" ? {
      "--color-background-primary": "#171717",
      "--color-background-secondary": "#212121",
      "--color-text-primary": "#f2f2f2",
      "--color-text-secondary": "#a8a8a8",
      "--color-border-secondary": "rgba(255,255,255,.13)"
    } : {
      "--color-background-primary": "#ffffff",
      "--color-background-secondary": "#f7f7f8",
      "--color-text-primary": "#0d0d0d",
      "--color-text-secondary": "#666666",
      "--color-border-secondary": "rgba(13,13,13,.12)"
    };
    let session = null;
    const analysis = {
      name: "Prepare the weekly handoff",
      description: "Create a concise, reviewed handoff with sources and unresolved risks.",
      goal: "Produce the same decision-ready weekly handoff.",
      category: "Work & Productivity",
      replayability: { status: "replayable", reasons: ["All steps map to available capabilities."], missing_capabilities: [] },
      steps: [
        { title: "Collect source updates", instruction: "Open the source notes and collect only the changes from this week." },
        { title: "Write the handoff", instruction: "Summarize completed work, open risks, owners, and next actions." },
        { title: "Verify the output", instruction: "Check every claim against a linked source before publishing." }
      ],
      alternatives: []
    };
    const recorder = {
      backend: "gnome",
      supported: true,
      label: "GNOME Wayland screen recorder",
      detail: "Native GNOME capture is available. No Codex relaunch or exported display variables are required."
    };
    const replyRaw = (id, result) => frame.contentWindow.postMessage({ jsonrpc: "2.0", id, result }, "*");
    const reply = (id, structuredContent) => replyRaw(id, { structuredContent });
    window.addEventListener("message", (event) => {
      if (event.source !== frame.contentWindow) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0" || message.id == null) return;
      if (message.method === "ui/initialize") return replyRaw(message.id, {
        protocolVersion: "2026-01-26",
        hostInfo: { name: "teach-gpt-preview", version: "0.2.0" },
        hostCapabilities: {},
        hostContext: { theme, styles: { variables } }
      });
      if (message.method !== "tools/call") return reply(message.id, {});
      const name = message.params?.name;
      const args = message.params?.arguments || {};
      if (name === "teach_begin") {
        session = { id: crypto.randomUUID(), state: "draft", name: args.name, description: args.description, created_at: new Date().toISOString() };
        return reply(message.id, { stage: "consent", session, recorder });
      }
      if (name === "teach_start") {
        session = { ...session, state: "recording", recording: { started_at: new Date().toISOString() } };
        return reply(message.id, { stage: "recording", session, recorder });
      }
      if (name === "teach_stop") {
        session = { ...session, state: "processing" };
        return reply(message.id, { stage: "processing", session });
      }
      if (name === "teach_analyze") {
        session = { ...session, state: "review" };
        return reply(message.id, { stage: "review", session, analysis });
      }
      if (name === "teach_review") {
        Object.assign(analysis, { name: args.name, description: args.description, goal: args.goal, category: args.category });
        return reply(message.id, { stage: "review", session, analysis });
      }
      if (name === "teach_optimize") {
        analysis.alternatives = [{ name: "Template-first handoff", description: "Use the same verified source data with a fixed output template.", verification_status: "testable" }];
        return reply(message.id, { stage: "review", session, analysis });
      }
      if (name === "teach_publish") {
        session = { ...session, state: "published", published_skill: { name: "prepare-weekly-handoff" } };
        return reply(message.id, { stage: "published", session });
      }
      reply(message.id, { stage: "setup", recorder });
    });
  </script>
</body>
</html>`;

Bun.serve({
  hostname: "127.0.0.1",
  port,
  fetch() {
    return new Response(preview, { headers: { "content-type": "text/html; charset=utf-8" } });
  },
});

console.log(`Teach GPT widget preview: http://127.0.0.1:${port}`);

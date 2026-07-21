import { TEACH_WIDGET_HTML } from "../packages/mcp/src/widget.ts";

const port = Number(process.env.TEACH_WIDGET_PORT || 3142);
const widgetSource = JSON.stringify(TEACH_WIDGET_HTML).replace(/<\//g, "<\\/");
let autoplayComplete = false;
let autoplayError: string | undefined;
let autoplayStartedAt: string | undefined;

const preview = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Teach widget preview</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; overflow-x: hidden; background: #eee9e1; font-family: system-ui, sans-serif; transition: background .2s ease; }
    #stage { position: relative; display: flex; align-items: flex-start; justify-content: center; gap: 24px; min-height: 100vh; padding: 16px; overflow: hidden; }
    iframe { display: block; width: min(1320px, calc(100% - 32px)); height: calc(100vh - 32px); border: 0; transition: width .55s ease; }
    #workspace { display: none; width: min(820px, 46vw); height: calc(100vh - 64px); margin-top: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,.13); border-radius: 22px; color: #f2f2f2; background: #171717; box-shadow: 0 18px 64px rgba(0,0,0,.28); }
    #workspace header { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,.1); }
    #workspace .eyebrow { margin: 0 0 5px; color: #8f83ff; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    #workspace h2 { margin: 0; font-size: 23px; }
    #workspace .editors { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; height: calc(100% - 82px); background: rgba(255,255,255,.1); }
    #workspace article { padding: 20px; background: #171717; }
    #workspace strong { display: block; margin-bottom: 14px; color: #aaa; font: 700 12px ui-monospace, monospace; }
    #workspace pre { margin: 0; white-space: pre-wrap; color: #ddd; font: 15px/1.65 ui-monospace, monospace; }
    #workspace .output { color: #f4f1ec; }
    body.workspace-open #stage { justify-content: center; }
    body.workspace-open iframe { width: min(900px, 49vw); }
    body.workspace-open #workspace { display: block; animation: workspace-in .45s ease both; }
    #demo-cursor { position: fixed; z-index: 20; left: 50%; top: 50%; width: 24px; height: 30px; pointer-events: none; opacity: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,.5)); transition: left .55s cubic-bezier(.2,.8,.2,1), top .55s cubic-bezier(.2,.8,.2,1), opacity .2s ease, transform .14s ease; }
    #demo-cursor svg { display: block; width: 100%; height: 100%; }
    #demo-cursor.clicking { transform: scale(.78); }
    body.autoplay #demo-cursor { opacity: 1; }
    @keyframes workspace-in { from { opacity: 0; transform: translateX(24px); } }
  </style>
</head>
<body>
  <div id="stage">
    <iframe id="widget" title="Teach MCP Apps preview"></iframe>
    <section id="workspace" aria-label="Synthetic demonstration workspace">
      <header><p class="eyebrow">Synthetic demo workspace</p><h2>Preparing the weekly handoff</h2></header>
      <div class="editors">
        <article><strong>source-notes.md</strong><pre id="source-notes">Project updates\n\n✓ Linux recorder verified — Maya\n✓ Review UX shipped — Theo\n✓ Windows CI green — Sam\n\nRisk\nmacOS permission walkthrough needs final capture — Maya\n\nNext\nRecord demo · Verify captions · Submit</pre></article>
        <article><strong>weekly-handoff.md</strong><pre class="output" id="handoff-output"></pre></article>
      </div>
    </section>
  </div>
  <div id="demo-cursor" aria-hidden="true"><svg viewBox="0 0 24 30"><path d="M2 2l18 13-8 2 4 8-4 2-4-8-6 6z" fill="#fff" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/></svg></div>
  <script>
    const frame = document.querySelector("#widget");
    frame.srcdoc = ${widgetSource};
    const query = new URLSearchParams(location.search);
    const autoplay = query.get("autoplay") === "1";
    const autoplayDelay = Number(query.get("delay") || 0);
    const requestedTheme = query.get("theme");
    if (autoplay) document.body.classList.add("autoplay");
    const theme = requestedTheme === "light" || requestedTheme === "dark"
      ? requestedTheme
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.body.style.background = theme === "dark" ? "#101011" : "#eee9e1";
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
        hostInfo: { name: "teach-preview", version: "0.2.0" },
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
        return setTimeout(() => reply(message.id, { stage: "review", session, analysis }), autoplay ? 12500 : 15000);
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
        const skillName = analysis.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        session = { ...session, state: "published", published_skill: { name: skillName } };
        return reply(message.id, { stage: "published", session });
      }
      reply(message.id, { stage: "setup", recorder });
    });

    const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const cursor = document.querySelector("#demo-cursor");
    const innerDocument = () => frame.contentDocument;

    async function waitFor(selector, timeout = 20000) {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        const element = innerDocument()?.querySelector(selector);
        if (element) return element;
        await sleep(80);
      }
      throw new Error("Autoplay target was not rendered: " + selector);
    }

    async function moveTo(element) {
      const target = element.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      cursor.style.left = (frameRect.left + target.left + Math.min(target.width * .72, target.width - 12)) + "px";
      cursor.style.top = (frameRect.top + target.top + target.height * .62) + "px";
      await sleep(600);
    }

    async function clickElement(element) {
      await moveTo(element);
      cursor.classList.add("clicking");
      element.click();
      await sleep(170);
      cursor.classList.remove("clicking");
    }

    function smoothScrollTo(target, duration = 1200) {
      const win = frame.contentWindow;
      const start = win.scrollY;
      const started = Date.now();
      return new Promise((resolve) => {
        function step() {
          const progress = Math.min(1, (Date.now() - started) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          win.scrollTo(0, start + (target - start) * eased);
          if (progress < 1) requestAnimationFrame(step);
          else resolve();
        }
        step();
      });
    }

    async function typeReviewName(value) {
      const input = await waitFor("#review-name");
      input.focus();
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      for (const character of value) {
        input.value += character;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(55);
      }
    }

    async function typeHandoff() {
      const output = document.querySelector("#handoff-output");
      const lines = [
        "# Weekly handoff",
        "",
        "## Completed",
        "- Linux recorder verified — Maya",
        "- Review UX shipped — Theo",
        "- Windows CI green — Sam",
        "",
        "## Risks",
        "- Complete macOS permission capture — Maya",
        "",
        "## Owners",
        "Maya · Theo · Sam",
        "",
        "## Next",
        "Record demo · Verify captions · Submit"
      ];
      for (const line of lines) {
        output.textContent += line + "\\n";
        await sleep(500);
      }
    }

    async function runAutoplay() {
      await sleep(Math.max(0, autoplayDelay));
      await waitFor('[data-action="skip"]');
      const widgetStyle = innerDocument().createElement("style");
      widgetStyle.textContent = ".shell{max-width:1200px} body{padding:16px}";
      innerDocument().head.append(widgetStyle);
      await fetch("/started", { method: "POST" });
      const started = Date.now();
      const at = async (seconds) => {
        const remaining = started + seconds * 1000 - Date.now();
        if (remaining > 0) await sleep(remaining);
      };
      await at(8.2);
      await clickElement(await waitFor('[data-action="skip"]'));
      await waitFor('[data-action="start"]');

      await at(15.2);
      await clickElement(await waitFor('[data-action="start"]'));
      await waitFor('[data-action="stop"]');

      await at(24);
      document.body.classList.add("workspace-open");
      await typeHandoff();

      await at(33.1);
      await clickElement(await waitFor('[data-action="stop"]'));
      document.body.classList.remove("workspace-open");
      await waitFor("#processing-timer");
      await waitFor("#review-name", 18000);

      await at(48.5);
      const reviewBottom = Math.max(0, innerDocument().documentElement.scrollHeight - frame.clientHeight + 18);
      await smoothScrollTo(reviewBottom, 9000);

      await at(60.2);
      await smoothScrollTo(0, 700);
      await at(61);
      await typeReviewName("Prepare the verified weekly handoff");
      const saveBottom = Math.max(0, innerDocument().documentElement.scrollHeight - frame.clientHeight + 18);
      await smoothScrollTo(saveBottom, 1100);
      await at(66.2);
      await clickElement(await waitFor('[data-action="save"]'));

      await at(68.2);
      await clickElement(await waitFor('[data-action="optimize"]'));
      await sleep(500);
      const optimizeBottom = Math.max(0, innerDocument().documentElement.scrollHeight - frame.clientHeight + 18);
      await smoothScrollTo(optimizeBottom, 1200);

      await at(78.2);
      await clickElement(await waitFor('[data-action="publish"]'));
      await waitFor(".card span");
      await at(85.5);
      cursor.style.opacity = "0";
      await fetch("/complete", { method: "POST" });
    }

    if (autoplay) {
      let autoplayStarted = false;
      const launchAutoplay = () => {
        if (autoplayStarted) return;
        autoplayStarted = true;
        runAutoplay().catch(async (error) => {
        console.error(error);
        await fetch("/complete?error=" + encodeURIComponent(error.message), { method: "POST" });
        });
      };
      frame.addEventListener("load", launchAutoplay, { once: true });
      if (frame.contentDocument?.readyState === "complete") setTimeout(launchAutoplay, 0);
    }
  </script>
</body>
</html>`;

Bun.serve({
  hostname: "127.0.0.1",
  port,
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/status") {
      return Response.json({ complete: autoplayComplete, error: autoplayError, started_at: autoplayStartedAt });
    }
    if (url.pathname === "/started" && request.method === "POST") {
      autoplayStartedAt = new Date().toISOString();
      return Response.json({ ok: true });
    }
    if (url.pathname === "/complete" && request.method === "POST") {
      autoplayComplete = true;
      autoplayError = url.searchParams.get("error") || undefined;
      return Response.json({ ok: true });
    }
    if (url.pathname === "/" && url.searchParams.get("autoplay") === "1") {
      autoplayComplete = false;
      autoplayError = undefined;
      autoplayStartedAt = undefined;
    }
    return new Response(preview, { headers: { "content-type": "text/html; charset=utf-8" } });
  },
});

console.log(`Teach widget preview: http://127.0.0.1:${port}`);

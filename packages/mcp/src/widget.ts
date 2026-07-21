export const TEACH_WIDGET_URI = "ui://teach/workflow-v2.html";

export const TEACH_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Teach</title>
  <style>
    :root {
      color-scheme: light;
      font-family: var(--font-sans, ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif);
      --fallback-ink: #0d0d0d;
      --fallback-muted: #666;
      --fallback-surface: #fff;
      --fallback-soft: #f7f7f8;
      --fallback-line: rgba(13, 13, 13, .12);
      --ink: var(--color-text-primary, var(--fallback-ink));
      --muted: var(--color-text-secondary, var(--fallback-muted));
      --surface: var(--color-background-primary, var(--fallback-surface));
      --soft: var(--color-background-secondary, var(--fallback-soft));
      --line: var(--color-border-secondary, var(--fallback-line));
      --violet: #6d5ef8;
      --violet-dark: #5545df;
      --green: #157f5b;
      --red: #c43d43;
    }
    :root[data-theme="dark"] {
      color-scheme: dark;
      --fallback-ink: #f2f2f2;
      --fallback-muted: #aaa;
      --fallback-surface: #171717;
      --fallback-soft: #212121;
      --fallback-line: rgba(255, 255, 255, .13);
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; color: var(--ink); background: transparent; }
    button, input, textarea { font: inherit; }
    .shell {
      overflow: hidden;
      max-width: 760px;
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: var(--border-radius-xl, 22px);
      background: var(--surface);
      box-shadow: var(--shadow-md, 0 16px 42px rgba(0, 0, 0, .08));
    }
    header { display: flex; align-items: center; gap: 16px; padding: 18px 20px; border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 11px; font-weight: 760; letter-spacing: -.02em; }
    .brand-mark { display: block; width: 34px; height: 34px; flex: 0 0 auto; }
    main { display: grid; gap: 18px; padding: 22px; }
    .eyebrow { margin: 0 0 7px; color: var(--violet); font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    h1 { margin: 0; font-family: inherit; font-size: clamp(25px, 5vw, 37px); font-weight: var(--font-weight-semibold, 620); line-height: 1.12; letter-spacing: -.035em; }
    h2 { margin: 0; font-size: 17px; letter-spacing: -.015em; }
    p { margin: 0; color: var(--muted); line-height: 1.55; }
    .stack { display: grid; gap: 13px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
    .card { padding: 14px; border: 1px solid var(--line); border-radius: 15px; background: var(--soft); }
    .card strong { display: block; margin-bottom: 4px; font-size: 13px; }
    .card span { color: var(--muted); font-size: 12px; line-height: 1.4; }
    label { display: grid; gap: 6px; font-size: 12px; font-weight: 720; }
    input, textarea { width: 100%; padding: 11px 12px; color: var(--ink); border: 1px solid var(--line); border-radius: 11px; background: var(--surface); outline: none; }
    textarea { min-height: 74px; resize: vertical; }
    input:focus, textarea:focus { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(109,94,248,.14); }
    .actions { display: flex; flex-wrap: wrap; gap: 9px; }
    button { min-height: 42px; padding: 10px 15px; border: 0; border-radius: 12px; cursor: pointer; font-weight: 750; transition: transform .14s ease, opacity .14s ease, background .14s ease; }
    button:hover { transform: translateY(-1px); }
    button:focus-visible { outline: 3px solid rgba(109,94,248,.28); outline-offset: 2px; }
    button:disabled { cursor: not-allowed; opacity: .55; transform: none; }
    .primary { color: white; background: var(--violet); }
    .primary:hover { background: var(--violet-dark); }
    .secondary { color: var(--ink); border: 1px solid var(--line); background: transparent; }
    .danger { color: white; background: var(--red); }
    .status { display: flex; align-items: flex-start; gap: 10px; padding: 12px 13px; border: 1px solid var(--line); border-radius: 13px; background: var(--soft); }
    .dot { flex: 0 0 auto; width: 9px; height: 9px; margin-top: 5px; border-radius: 999px; background: var(--green); box-shadow: 0 0 0 4px rgba(21,127,91,.12); }
    .dot.recording { background: var(--red); box-shadow: 0 0 0 4px rgba(196,61,67,.12); animation: pulse 1.4s infinite; }
    .status strong { display: block; font-size: 13px; }
    .status small { display: block; margin-top: 2px; color: var(--muted); line-height: 1.4; }
    .error { padding: 12px 13px; border: 1px solid rgba(196,61,67,.28); border-radius: 12px; color: var(--red); background: rgba(196,61,67,.08); font-size: 13px; line-height: 1.45; }
    .error strong, .error span { display: block; }
    .error span { margin-top: 2px; }
    .recording-panel { padding: 22px; border-radius: 18px; color: white; background: linear-gradient(135deg, #2b2232, #4a2c46); }
    .recording-panel p { color: rgba(255,255,255,.72); }
    .timer { margin: 9px 0 17px; font-variant-numeric: tabular-nums; font-size: 42px; font-weight: 760; letter-spacing: -.04em; }
    .steps { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .step { display: grid; grid-template-columns: 28px 1fr; gap: 10px; padding: 11px; border: 1px solid var(--line); border-radius: 12px; }
    .step-index { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; color: var(--violet); background: rgba(109,94,248,.12); font-weight: 800; font-size: 12px; }
    .step strong { font-size: 13px; }
    .step p { margin-top: 3px; font-size: 12px; }
    .pill { display: inline-flex; align-items: center; width: fit-content; padding: 5px 9px; border-radius: 999px; color: var(--violet-dark); background: rgba(109,94,248,.12); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    .busy { pointer-events: none; }
    .busy button { opacity: .55; }
    .processing-panel { display: grid; gap: 18px; }
    .processing-activity { display: grid; grid-template-columns: 58px 1fr; align-items: center; gap: 15px; padding: 15px; border: 1px solid var(--line); border-radius: 16px; background: var(--soft); }
    .processing-orbit { position: relative; width: 54px; height: 54px; }
    .processing-ring { position: absolute; inset: 0; border: 2px solid rgba(109,94,248,.16); border-top-color: var(--violet); border-radius: 999px; animation: orbit 1.35s linear infinite; }
    .processing-core { position: absolute; inset: 14px; border-radius: 999px; background: var(--violet); box-shadow: 0 0 0 7px rgba(109,94,248,.12); animation: breathe 1.6s ease-in-out infinite; }
    .processing-copy { min-width: 0; }
    .processing-copy strong { display: block; font-size: 14px; }
    .processing-copy span { display: block; min-height: 1.5em; margin-top: 3px; color: var(--muted); font-size: 12px; line-height: 1.5; }
    .processing-progress { position: relative; height: 5px; overflow: hidden; border-radius: 999px; background: rgba(109,94,248,.13); }
    .processing-progress::after { content: ""; position: absolute; inset: 0 auto 0 -35%; width: 35%; border-radius: inherit; background: linear-gradient(90deg, transparent, var(--violet), transparent); animation: sweep 1.8s ease-in-out infinite; }
    .processing-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 16px; color: var(--muted); font-size: 12px; }
    .processing-meta strong { color: var(--ink); font-variant-numeric: tabular-nums; }
    @keyframes pulse { 50% { transform: scale(.82); opacity: .62; } }
    @keyframes orbit { to { transform: rotate(360deg); } }
    @keyframes breathe { 50% { transform: scale(.72); opacity: .7; } }
    @keyframes sweep { 50%, 100% { transform: translateX(390%); } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  </style>
</head>
<body>
  <section class="shell" aria-label="Teach workflow controls">
    <header>
      <div class="brand">
        <svg class="brand-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#6D5EF8" />
          <path d="M17 20h30M32 20v28M21 34h22" stroke="white" stroke-width="6" stroke-linecap="round" />
          <circle cx="46" cy="46" r="8" fill="#FF6B5F" stroke="white" stroke-width="3" />
        </svg>
        <span>Teach</span>
      </div>
    </header>
    <main id="app" aria-live="polite"></main>
  </section>
  <script type="module">
    const app = document.querySelector("#app");
    let data = window.openai?.toolOutput ?? { stage: "setup" };
    let errorMessage = "";
    let busy = false;
    let rpcId = 0;
    let hostContext = {};
    let processingStartedAt = null;
    const pending = new Map();

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
      })[character]);
    }

    function request(method, params) {
      return new Promise((resolve, reject) => {
        const id = ++rpcId;
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error("Codex did not answer the UI action in time."));
        }, 30000);
        pending.set(id, { resolve, reject, timeout });
        window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
      });
    }

    function notify(method, params) {
      window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
    }

    function applyHostContext(next = {}) {
      hostContext = {
        ...hostContext,
        ...next,
        styles: {
          ...(hostContext.styles || {}),
          ...(next.styles || {}),
          variables: {
            ...(hostContext.styles?.variables || {}),
            ...(next.styles?.variables || {})
          }
        }
      };
      const root = document.documentElement;
      const fallbackTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const theme = hostContext.theme || window.openai?.theme || fallbackTheme;
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      for (const [name, value] of Object.entries(hostContext.styles?.variables || {})) {
        if (name.startsWith("--") && typeof value === "string") root.style.setProperty(name, value);
      }
      const fontCss = hostContext.styles?.css?.fonts;
      if (fontCss && !document.querySelector("#teach-host-fonts")) {
        const style = document.createElement("style");
        style.id = "teach-host-fonts";
        style.textContent = fontCss;
        document.head.append(style);
      }
    }

    applyHostContext();
    const colorScheme = window.matchMedia?.("(prefers-color-scheme: dark)");
    colorScheme?.addEventListener?.("change", () => {
      if (!hostContext.theme) applyHostContext();
    });

    async function initialize() {
      const initialized = await request("ui/initialize", {
        appInfo: { name: "teach-widget", version: "0.3.0" },
        appCapabilities: {},
        protocolVersion: "2026-01-26"
      });
      applyHostContext(initialized?.hostContext || {});
      notify("ui/notifications/initialized", {});
    }

    // Codex exposes the Apps SDK compatibility bridge directly. Do not make a
    // native button click wait for an unanswered ui/initialize request when
    // callTool is already available. Standards-only MCP Apps hosts continue to
    // use the JSON-RPC bridge below.
    const bridgeReady = typeof window.openai?.callTool === "function"
      ? Promise.resolve(null)
      : initialize().catch(() => null);

    async function callTool(name, args) {
      const cleanArgs = Object.fromEntries(Object.entries(args || {}).filter(([, value]) => value !== undefined));
      if (typeof window.openai?.callTool === "function") {
        return window.openai.callTool(name, cleanArgs);
      }
      await bridgeReady;
      const response = await request("tools/call", { name, arguments: cleanArgs });
      if (response?.isError) {
        const message = response.content?.find?.((item) => item.type === "text")?.text || "Teach tool call failed.";
        throw new Error(message);
      }
      return response;
    }

    function unwrap(response) {
      return response?.structuredContent ?? response?.result?.structuredContent ?? response ?? data;
    }

    function recorderProblem() {
      const recorder = data?.recorder;
      if (!recorder || recorder.supported) return "";
      return '<div class="error" role="alert"><strong>' +
        escapeHtml(recorder.label) + '</strong><span>' + escapeHtml(recorder.detail) + '</span></div>';
    }

    function setupView() {
      return '<div class="stack">' +
        '<div><h1>What do you want to teach</h1></div>' +
        '<p>Name and description are optional. You can skip them and let Codex propose both after the recording.</p>' +
        recorderProblem() +
        '<label>Name <input id="name" maxlength="80" placeholder="e.g. Prepare the weekly handoff" /></label>' +
        '<label>Description <textarea id="description" maxlength="500" placeholder="What output should remain the same?"></textarea></label>' +
        '<div class="actions"><button class="primary" data-action="begin">Continue</button>' +
        '<button class="secondary" data-action="skip">Skip</button></div></div>';
    }

    function consentView(session) {
      const unsupported = data?.recorder && !data.recorder.supported;
      return '<div class="stack">' +
        '<div><p class="eyebrow">Ready when you are</p><h1>' + escapeHtml(session.name || "Untitled workflow") + '</h1></div>' +
        '<p>Starting creates a short-lived authorization receipt, then invokes this computer’s supported screen recorder.</p>' +
        recorderProblem() +
        '<div class="grid">' +
        '<div class="card"><strong>Recorded</strong><span>Screen and pointer only</span></div>' +
        '<div class="card"><strong>Stored locally</strong><span>Private session directory</span></div>' +
        '</div><div class="actions"><button class="primary" data-action="start" ' + (unsupported ? 'disabled' : '') + '>I’m ready — start recording</button></div></div>';
    }

    function recordingView(session) {
      return '<div class="recording-panel"><div class="status" style="border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.08)">' +
        '<span class="dot recording"></span><div><strong>Recording is active</strong><small>Your screen and cursor are being captured locally.</small></div></div>' +
        '<div class="timer" id="timer">00:00</div><p>Complete the workflow naturally. End it here or say “done” in the conversation.</p>' +
        '<div class="actions" style="margin-top:18px"><button class="danger" data-action="stop">End recording</button></div></div>';
    }

    function processingView() {
      return '<div class="processing-panel" role="status" aria-live="polite" aria-busy="true">' +
        '<div><p class="eyebrow">Processing</p><h1>Turning the demonstration into a process…</h1></div>' +
        '<p>Teach is extracting bounded frames and asking your configured Codex model for structured labels.</p>' +
        '<div class="processing-activity"><div class="processing-orbit" aria-hidden="true"><span class="processing-ring"></span><span class="processing-core"></span></div>' +
        '<div class="processing-copy"><strong>Analysis is active</strong><span id="processing-status">Reading the recorded demonstration…</span></div></div>' +
        '<div class="processing-progress" aria-hidden="true"></div>' +
        '<div class="processing-meta"><span>This can take a few minutes for longer recordings.</span><span><strong id="processing-timer">00:00</strong> elapsed</span></div></div>';
    }

    function reviewView(analysis) {
      const steps = (analysis.steps || []).map((step, index) => '<li class="step"><span class="step-index">' +
        (index + 1) + '</span><div><strong>' + escapeHtml(step.title) + '</strong><p>' + escapeHtml(step.instruction) + '</p></div></li>').join("");
      const alternatives = (analysis.alternatives || []).map((alternative) => '<div class="card"><strong>' +
        escapeHtml(alternative.name) + '</strong><span>' + escapeHtml(alternative.description) + ' · ' +
        escapeHtml(alternative.verification_status) + '</span></div>').join("");
      return '<div class="stack"><div><p class="eyebrow">Review what Codex learned</p><h1>' + escapeHtml(analysis.name) + '</h1></div>' +
        '<span class="pill">' + escapeHtml(analysis.replayability?.status || "unknown") + '</span>' +
        '<label>Name <input id="review-name" maxlength="80" value="' + escapeHtml(analysis.name) + '" /></label>' +
        '<label>Description <textarea id="review-description" maxlength="400">' + escapeHtml(analysis.description) + '</textarea></label>' +
        '<label>Goal <textarea id="review-goal" maxlength="400">' + escapeHtml(analysis.goal) + '</textarea></label>' +
        '<label>Category <input id="review-category" maxlength="80" value="' + escapeHtml(analysis.category) + '" /></label>' +
        '<div class="stack"><h2>Steps</h2><ol class="steps">' + steps + '</ol></div>' +
        (alternatives ? '<div class="stack"><h2>Output-equivalent alternatives</h2><div class="grid">' + alternatives + '</div></div>' : '') +
        '<div class="actions"><button class="secondary" data-action="save">Save edits</button>' +
        '<button class="secondary" data-action="optimize">Suggest alternatives</button>' +
        '<button class="primary" data-action="publish">Publish skill</button></div></div>';
    }

    function publishedView(session) {
      const skill = session.published_skill;
      return '<div class="stack"><p class="eyebrow">Skill published</p><h1>' + escapeHtml(skill?.name || "Workflow ready") + '</h1>' +
        '<p>The reviewed process is now available to Codex as a portable local skill.</p>' +
        '<div class="card"><strong>Invoke it</strong><span>$' + escapeHtml(skill?.name || "skill-name") + '</span></div></div>';
    }

    function render() {
      const session = data?.session;
      const state = session?.state;
      let html;
      if (!session || data.stage === "setup") html = setupView();
      else if (state === "draft" || state === "ready") html = consentView(session);
      else if (state === "recording") html = recordingView(session);
      else if (state === "processing") html = processingView();
      else if (state === "review" && data.analysis) html = reviewView(data.analysis);
      else if (state === "published") html = publishedView(session);
      else html = '<div class="stack"><h1>Teaching session</h1><p>' + escapeHtml(data?.next_action || state || "Waiting") + '</p></div>';
      app.innerHTML = (errorMessage ? '<div class="error" role="alert">' + escapeHtml(errorMessage) + '</div>' : '') + html;
      app.classList.toggle("busy", busy);
      if (state === "recording") updateTimer(session.recording?.started_at);
      if (state === "processing") {
        if (processingStartedAt === null) processingStartedAt = Date.now();
        updateProcessingIndicator();
      } else {
        processingStartedAt = null;
      }
    }

    function updateTimer(startedAt) {
      const timer = document.querySelector("#timer");
      if (!timer || !startedAt) return;
      const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
      timer.textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
    }

    function updateProcessingIndicator() {
      if (processingStartedAt === null) return;
      const seconds = Math.max(0, Math.floor((Date.now() - processingStartedAt) / 1000));
      const timer = document.querySelector("#processing-timer");
      const status = document.querySelector("#processing-status");
      const messages = [
        "Reading the recorded demonstration…",
        "Identifying repeatable actions…",
        "Structuring goals and steps…",
        "Checking what Codex can replay…",
        "Preparing labels for your review…"
      ];
      if (timer) timer.textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
      if (status) status.textContent = messages[Math.floor(seconds / 6) % messages.length];
    }

    setInterval(() => {
      if (data?.session?.state === "recording") updateTimer(data.session.recording?.started_at);
      if (data?.session?.state === "processing") updateProcessingIndicator();
    }, 1000);

    async function run(action) {
      const formValues = {
        name: document.querySelector("#name")?.value || undefined,
        description: document.querySelector("#description")?.value || undefined,
        reviewName: document.querySelector("#review-name")?.value,
        reviewDescription: document.querySelector("#review-description")?.value,
        reviewGoal: document.querySelector("#review-goal")?.value,
        reviewCategory: document.querySelector("#review-category")?.value
      };
      busy = true; errorMessage = ""; render();
      try {
        const sessionId = data?.session?.id;
        if (action === "begin" || action === "skip") {
          const args = action === "skip" ? {} : {
            name: formValues.name,
            description: formValues.description
          };
          data = unwrap(await callTool("teach_begin", args));
        } else if (action === "start") {
          data = unwrap(await callTool("teach_start", { session_id: sessionId, consent: true }));
        } else if (action === "stop") {
          data = unwrap(await callTool("teach_stop", { session_id: sessionId }));
          render();
          data = unwrap(await callTool("teach_analyze", { session_id: sessionId }));
        } else if (action === "save") {
          data = unwrap(await callTool("teach_review", {
            session_id: sessionId,
            name: formValues.reviewName,
            description: formValues.reviewDescription,
            goal: formValues.reviewGoal,
            category: formValues.reviewCategory
          }));
        } else if (action === "optimize") {
          data = unwrap(await callTool("teach_optimize", { session_id: sessionId }));
        } else if (action === "publish") {
          data = unwrap(await callTool("teach_publish", { session_id: sessionId }));
        }
      } catch (error) {
        errorMessage = error?.message || error?.data?.message || JSON.stringify(error);
      } finally {
        busy = false; render();
      }
    }

    app.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (button && !button.disabled) run(button.dataset.action);
    });

    window.addEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.id != null) {
        const task = pending.get(message.id);
        if (!task) return;
        clearTimeout(task.timeout); pending.delete(message.id);
        if (message.error) task.reject(message.error); else task.resolve(message.result);
        return;
      }
      if (message.method === "ui/notifications/tool-result") {
        data = message.params?.structuredContent ?? data;
        errorMessage = "";
        render();
      } else if (message.method === "ui/notifications/host-context-changed") {
        applyHostContext(message.params || {});
      }
    }, { passive: true });

    window.addEventListener("openai:set_globals", (event) => {
      const globals = event.detail?.globals;
      if (globals?.toolOutput) {
        data = globals.toolOutput;
        errorMessage = "";
      }
      const nextContext = {};
      if (globals?.theme) nextContext.theme = globals.theme;
      if (globals?.styles) nextContext.styles = globals.styles;
      applyHostContext(nextContext);
      render();
    }, { passive: true });

    render();
  </script>
</body>
</html>`;

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import { TEACH_WIDGET_HTML } from "../src/widget.ts";

test("embedded Skip uses Codex native callTool without waiting for MCP initialization", async () => {
  const script = TEACH_WIDGET_HTML.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, "widget module script should be embedded");

  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const postMessages: unknown[] = [];
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  let click: ((event: { target: { closest: () => { disabled: boolean; dataset: { action: string } } } }) => void) | undefined;
  const app = {
    innerHTML: "",
    classList: { toggle: () => undefined },
    addEventListener: (name: string, listener: typeof click) => {
      if (name === "click") click = listener;
    },
  };
  const root = {
    dataset: {} as Record<string, string>,
    style: { colorScheme: "", setProperty: () => undefined },
  };
  const openai = {
    toolOutput: { stage: "setup" },
    callTool: async (name: string, args: Record<string, unknown>) => {
      toolCalls.push({ name, args });
      return {
        structuredContent: {
          stage: "consent",
          session: { id: "00000000-0000-4000-8000-000000000001", state: "draft" },
          recorder: { supported: true },
        },
      };
    },
  };
  const parent = { postMessage: (message: unknown) => postMessages.push(message) };
  const windowObject = {
    openai,
    parent,
    matchMedia: () => ({ matches: false, addEventListener: () => undefined }),
    addEventListener: (name: string, listener: (event: Record<string, unknown>) => void) => listeners.set(name, listener),
  };
  const documentObject = {
    documentElement: root,
    head: { append: () => undefined },
    querySelector: (selector: string) => selector === "#app" ? app : null,
    createElement: () => ({ id: "", textContent: "" }),
  };

  vm.runInNewContext(script, {
    window: windowObject,
    document: documentObject,
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    console,
    Promise,
    Object,
    String,
    Date,
    Math,
    JSON,
  });
  assert.ok(click, "widget should register its click handler");

  click({ target: { closest: () => ({ disabled: false, dataset: { action: "skip" } }) } });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(toolCalls, [{ name: "teach_begin", args: {} }]);
  assert.equal(postMessages.length, 0, "native Codex actions must not wait on the JSON-RPC initialization bridge");
  assert.match(app.innerHTML, /I’m ready — start recording/);
});

test("packaged launchers key extracted runtimes by archive content", async () => {
  const packageRoot = resolve(dirname(dirname(fileURLToPath(import.meta.url))), "..", "..");
  const posix = await readFile(join(packageRoot, "plugins", "teach", "bin", "teach-mcp"), "utf8");
  const windows = await readFile(join(packageRoot, "packages", "launcher", "main.go"), "utf8");
  assert.match(posix, /cksum "\$archive"/);
  assert.match(posix, /archive_fingerprint/);
  assert.match(windows, /archiveFingerprint\(archive\)/);
  assert.match(windows, /sha256\.New\(\)/);
  assert.doesNotMatch(posix, /0\.3\.0-r\d/);
  assert.doesNotMatch(windows, /runtimeVersion/);
});

test("MCP server exposes the complete teaching lifecycle", { timeout: 20_000 }, async () => {
  const home = await mkdtemp(join(tmpdir(), "teach-mcp-"));
  const cwd = dirname(dirname(fileURLToPath(import.meta.url)));
  const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", "src/index.ts"],
    cwd,
    env: { ...env, TEACH_HOME: home, TEACH_RECORDER: "demo", TEACH_ANALYZER: "fixture" },
    stderr: "pipe",
  });
  const client = new Client({ name: "teach-test", version: "0.1.0" });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name);
    assert.deepEqual(names.sort(), [
      "teach_analyze",
      "teach_begin",
      "teach_get",
      "teach_list",
      "teach_open",
      "teach_optimize",
      "teach_publish",
      "teach_review",
      "teach_start",
      "teach_stop",
    ]);
    const resources = await client.listResources();
    assert.ok(resources.resources.some((resource) => resource.uri === "ui://teach/workflow-v2.html"));
    const widget = await client.readResource({ uri: "ui://teach/workflow-v2.html" });
    const widgetText = JSON.stringify(widget);
    const widgetHtml = (widget.contents[0] as { text?: string }).text || "";
    assert.match(widgetText, /text\/html;profile=mcp-app/);
    assert.match(widgetText, /What do you want to teach/);
    assert.match(widgetText, />Continue</);
    assert.match(widgetText, />Skip</);
    assert.match(widgetText, /I’m ready — start recording/);
    assert.match(widgetText, /End recording/);
    assert.match(widgetText, /brand-mark/);
    assert.match(widgetText, /host-context-changed/);
    assert.match(widgetText, /color-background-primary/);
    assert.match(widgetHtml, /typeof window\.openai\?\.callTool === "function"/);
    assert.match(widgetHtml, /window\.openai\.callTool\(name, cleanArgs\)/);
    assert.match(widgetHtml, /request\("tools\/call", \{ name, arguments: cleanArgs \}\)/);
    assert.match(widgetHtml, /openai:set_globals/);
    assert.doesNotMatch(widgetText, /Visible capture · local artifacts/);
    assert.doesNotMatch(widgetText, /New teaching/);
    assert.doesNotMatch(widgetText, /What will you show Codex/);
    assert.doesNotMatch(widgetText, /<footer>/);

    const opened = await client.callTool({ name: "teach_open", arguments: {} });
    assert.equal(opened.isError, undefined);
    assert.match(JSON.stringify(opened), /"stage":"setup"/);
    const created = await client.callTool({ name: "teach_begin", arguments: {} });
    assert.equal(created.isError, undefined);
    assert.match(JSON.stringify(created), /explicit Ready button/);
    const sessionId = (created.structuredContent as { session: { id: string } }).session.id;
    const started = await client.callTool({ name: "teach_start", arguments: { session_id: sessionId, consent: true } });
    assert.equal(started.isError, undefined);
    assert.match(JSON.stringify(started), /"state":"recording"/);
    const stopped = await client.callTool({ name: "teach_stop", arguments: { session_id: sessionId } });
    assert.equal(stopped.isError, undefined);
    assert.match(JSON.stringify(stopped), /"state":"processing"/);
    const analyzed = await client.callTool({ name: "teach_analyze", arguments: { session_id: sessionId } });
    assert.equal(analyzed.isError, undefined);
    assert.match(JSON.stringify(analyzed), /"state":"review"/);
  } finally {
    await client.close();
    await rm(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

test("packaged backend starts without Bun or graphical environment variables", { timeout: 20_000 }, async () => {
  const home = await mkdtemp(join(tmpdir(), "teach-packaged-"));
  const packageRoot = resolve(dirname(dirname(fileURLToPath(import.meta.url))), "..", "..");
  const executable = join(packageRoot, "plugins", "teach", "bin", process.platform === "win32" ? "teach-mcp.exe" : "teach-mcp");
  const minimalPath = process.platform === "win32"
    ? join(process.env.SystemRoot || "C:\\Windows", "System32")
    : "/usr/bin:/bin";
  const inherited = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const transport = new StdioClientTransport({
    command: executable,
    args: [],
    cwd: join(packageRoot, "plugins", "teach"),
    env: {
      ...inherited,
      HOME: home,
      LOCALAPPDATA: join(home, "cache"),
      PATH: minimalPath,
      XDG_CACHE_HOME: join(home, "cache"),
      TEACH_HOME: home,
      TEACH_RECORDER: "demo",
      TEACH_ANALYZER: "fixture",
    },
    stderr: "pipe",
  });
  const client = new Client({ name: "teach-package-test", version: "0.1.0" });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.ok(tools.tools.some((tool) => tool.name === "teach_open"));
    const opened = await client.callTool({ name: "teach_open", arguments: {} });
    assert.match(JSON.stringify(opened), /Deterministic demo recorder/);
  } finally {
    await client.close();
    await rm(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
});

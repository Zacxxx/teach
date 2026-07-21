import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

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
    assert.match(widgetHtml, /request\("tools\/call", \{ name, arguments: cleanArgs \}\)/);
    assert.doesNotMatch(widgetHtml, /window\.openai\?\.callTool/);
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

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("MCP server exposes the complete teaching lifecycle", async () => {
  const home = await mkdtemp(join(tmpdir(), "teach-gpt-mcp-"));
  const cwd = dirname(dirname(fileURLToPath(import.meta.url)));
  const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", "src/index.ts"],
    cwd,
    env: { ...env, TEACH_GPT_HOME: home, TEACH_GPT_RECORDER: "demo", TEACH_GPT_ANALYZER: "fixture" },
    stderr: "pipe",
  });
  const client = new Client({ name: "teach-gpt-test", version: "0.1.0" });
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
    assert.ok(resources.resources.some((resource) => resource.uri === "ui://teach-gpt/workflow-v2.html"));
    const widget = await client.readResource({ uri: "ui://teach-gpt/workflow-v2.html" });
    assert.match(JSON.stringify(widget), /text\/html;profile=mcp-app/);
    assert.match(JSON.stringify(widget), /I’m ready — start recording/);
    assert.match(JSON.stringify(widget), /End recording/);

    const opened = await client.callTool({ name: "teach_open", arguments: {} });
    assert.equal(opened.isError, undefined);
    assert.match(JSON.stringify(opened), /"stage":"setup"/);
    const created = await client.callTool({ name: "teach_begin", arguments: {} });
    assert.equal(created.isError, undefined);
    assert.match(JSON.stringify(created), /explicit Ready button/);
  } finally {
    await client.close();
    await rm(home, { recursive: true, force: true });
  }
});

test("packaged Linux backend starts without Bun or graphical environment variables", async () => {
  const home = await mkdtemp(join(tmpdir(), "teach-gpt-packaged-"));
  const packageRoot = resolve(dirname(dirname(fileURLToPath(import.meta.url))), "..", "..");
  const executable = join(packageRoot, "plugins", "teach-gpt", "bin", "teach-gpt-mcp");
  const transport = new StdioClientTransport({
    command: executable,
    args: [],
    cwd: join(packageRoot, "plugins", "teach-gpt"),
    env: {
      HOME: process.env.HOME || tmpdir(),
      PATH: "/usr/bin:/bin",
      XDG_CACHE_HOME: join(home, "cache"),
      TEACH_GPT_HOME: home,
      TEACH_GPT_RECORDER: "demo",
      TEACH_GPT_ANALYZER: "fixture",
    },
    stderr: "pipe",
  });
  const client = new Client({ name: "teach-gpt-package-test", version: "0.1.0" });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.ok(tools.tools.some((tool) => tool.name === "teach_open"));
    const opened = await client.callTool({ name: "teach_open", arguments: {} });
    assert.match(JSON.stringify(opened), /Deterministic demo recorder/);
  } finally {
    await client.close();
    await rm(home, { recursive: true, force: true });
  }
});

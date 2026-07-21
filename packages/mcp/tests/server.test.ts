import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
      "teach_optimize",
      "teach_publish",
      "teach_review",
      "teach_start",
      "teach_stop",
    ]);
    const created = await client.callTool({ name: "teach_begin", arguments: {} });
    assert.equal(created.isError, undefined);
    assert.match(JSON.stringify(created), /explicit ready confirmation/);
  } finally {
    await client.close();
    await rm(home, { recursive: true, force: true });
  }
});

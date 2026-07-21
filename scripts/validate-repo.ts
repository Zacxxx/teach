import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const pluginRoot = join(root, "plugins", "teach");
const manifest = JSON.parse(await readFile(join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8")) as Record<string, unknown>;

assert(manifest.name === "teach", "plugin name must match its folder");
assert(/^\d+\.\d+\.\d+/.test(String(manifest.version)), "plugin version must be semver");
assert(typeof manifest.description === "string" && manifest.description.length > 20, "plugin description is required");
assert(manifest.mcpServers === "./.mcp.json", "plugin must declare its MCP companion file");
assert(manifest.skills === "./skills/", "plugin must declare its skills directory");

for (const relative of [
  ".mcp.json",
  "assets/icon.svg",
  "assets/logo.svg",
  "bin/teach-mcp",
  "bin/teach-mcp.exe",
  "bin/teach-mcp-linux-x64.gz",
  "bin/teach-mcp-linux-arm64.gz",
  "bin/teach-mcp-darwin-x64.gz",
  "bin/teach-mcp-darwin-arm64.gz",
  "bin/teach-mcp-windows-x64.gz",
  "bin/teach-mcp.js",
  "skills/teach/SKILL.md",
  "skills/teach/agents/openai.yaml",
]) await access(join(pluginRoot, relative));

const skill = await readFile(join(pluginRoot, "skills", "teach", "SKILL.md"), "utf8");
assert(/^---\nname: teach\ndescription: [^\n]+\n---\n/.test(skill), "Teach skill frontmatter is invalid");
assert(!skill.includes("[TODO"), "Teach skill contains a placeholder");
assert(skill.length < 20_000, "Teach skill should stay concise");

const mcp = JSON.parse(await readFile(join(pluginRoot, ".mcp.json"), "utf8")) as { mcpServers?: Record<string, { command?: string; args?: string[] }> };
const server = mcp.mcpServers?.["teach"];
assert(server?.command === "./bin/teach-mcp", "MCP server must use the cross-platform self-contained launcher");
assert(server.args?.length === 0, "MCP server must not require runtime package arguments");

const mcpSource = await readFile(join(root, "packages", "mcp", "src", "index.ts"), "utf8");
assert(mcpSource.includes("registerAppResource"), "MCP server must register the native embedded UI resource");
assert(mcpSource.includes("teach_open"), "MCP server must expose the UI-first entry tool");

console.log("Teach repository validation passed.");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

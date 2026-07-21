import { gzipSync } from "node:zlib";
import { chmod, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const entrypoint = join(root, "packages", "mcp", "src", "index.ts");
const bin = join(root, "plugins", "teach", "bin");

await run(["bun", "build", entrypoint, "--target=bun", "--minify", `--outfile=${join(bin, "teach-mcp.js")}`]);

const targets = [
  ["bun-linux-x64-baseline", "teach-mcp-linux-x64"],
  ["bun-linux-arm64", "teach-mcp-linux-arm64"],
  ["bun-darwin-x64", "teach-mcp-darwin-x64"],
  ["bun-darwin-arm64", "teach-mcp-darwin-arm64"],
  ["bun-windows-x64-baseline", "teach-mcp-windows-x64.exe"],
] as const;

for (const [target, filename] of targets) {
  const output = join(bin, filename);
  await run(["bun", "build", entrypoint, "--compile", `--target=${target}`, "--minify", `--outfile=${output}`]);
  const compressedName = filename.replace(/\.exe$/, "") + ".gz";
  await writeFile(join(bin, compressedName), gzipSync(await readFile(output), { level: 9 }), { mode: 0o600 });
  await rm(output);
}

await run(
  ["go", "build", "-trimpath", "-ldflags=-s -w", "-o", join(bin, "teach-mcp.exe"), join(root, "packages", "launcher", "main.go")],
  { GOOS: "windows", GOARCH: "amd64", CGO_ENABLED: "0" },
);
await chmod(join(bin, "teach-mcp"), 0o755);

async function run(command: string[], extraEnv: Record<string, string> = {}): Promise<void> {
  const child = Bun.spawn(command, {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stdout: "inherit",
    stderr: "inherit",
  });
  const status = await child.exited;
  if (status !== 0) throw new Error(`${command.join(" ")} exited with ${status}`);
}

import { spawnSync } from "node:child_process";
import { liveEvalCases } from "./cases.ts";
import { gradeLiveCase } from "./live-grader.ts";
import { createReport, emitReport, repoRoot } from "./report.ts";

const selectedId = process.env.TEACH_LIVE_EVAL_CASE?.trim();
const selected = selectedId ? liveEvalCases.filter((entry) => entry.id === selectedId) : liveEvalCases;
if (selected.length === 0) throw new Error(`unknown_live_eval_case:${selectedId}`);

const results = selected.map((definition) => {
  const started = Date.now();
  const result = spawnSync(process.env.TEACH_CODEX_COMMAND?.trim() || "codex", [
    "exec",
    "--json",
    "--ephemeral",
    "--color",
    "never",
    "--sandbox",
    "read-only",
    "--cd",
    repoRoot,
    definition.prompt,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, RUST_LOG: process.env.RUST_LOG || "error" },
    maxBuffer: 10_000_000,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 240_000,
    windowsHide: true,
  });
  return gradeLiveCase(
    definition,
    result.stdout || "",
    [result.error?.message, result.stderr].filter(Boolean).join("\n"),
    result.status ?? 1,
    Date.now() - started,
  );
});

await emitReport(createReport("live", results));

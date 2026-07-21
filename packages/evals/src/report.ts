import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface EvalCheck {
  name: string;
  passed: boolean;
  evidence: string;
}

export interface EvalCaseResult {
  id: string;
  passed: boolean;
  checks: EvalCheck[];
  duration_ms: number;
}

export interface EvalReport {
  schema_version: 1;
  kind: "contract" | "live";
  generated_at: string;
  passed: boolean;
  score: number;
  passed_checks: number;
  total_checks: number;
  cases: EvalCaseResult[];
}

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export function createReport(kind: EvalReport["kind"], cases: EvalCaseResult[]): EvalReport {
  const checks = cases.flatMap((entry) => entry.checks);
  const passedChecks = checks.filter((check) => check.passed).length;
  return {
    schema_version: 1,
    kind,
    generated_at: new Date().toISOString(),
    passed: cases.every((entry) => entry.passed),
    score: checks.length === 0 ? 0 : Number((passedChecks / checks.length).toFixed(4)),
    passed_checks: passedChecks,
    total_checks: checks.length,
    cases,
  };
}

export async function emitReport(report: EvalReport): Promise<void> {
  const directory = join(repoRoot, ".teach", "evals");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(join(directory, `latest-${report.kind}.json`), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
}

export function check(name: string, passed: boolean, evidence: unknown): EvalCheck {
  return {
    name,
    passed,
    evidence: typeof evidence === "string" ? evidence.slice(0, 500) : JSON.stringify(evidence).slice(0, 500),
  };
}

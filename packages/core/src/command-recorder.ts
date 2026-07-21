import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export type CommandRecorderBackend = "macos" | "windows";

export interface CommandRecorderSpec {
  backend: CommandRecorderBackend;
  command: string;
  args: string[];
  path: string;
  stop: "signal" | "stdin";
}

interface CommandRecorderHandle {
  child: ChildProcessWithoutNullStreams;
  spec: CommandRecorderSpec;
  stderr: string;
  stopping: boolean;
  armed: boolean;
  failure?: string;
  failureReported: boolean;
  onUnexpectedFailure: (message: string) => void | Promise<void>;
}

const recorders = new Map<string, CommandRecorderHandle>();

export async function startCommandRecorder(
  sessionId: string,
  spec: CommandRecorderSpec,
  onUnexpectedFailure: (message: string) => void | Promise<void>,
): Promise<string> {
  if (recorders.has(sessionId)) throw new Error(`${spec.backend}_recording_already_started`);
  const child = spawn(spec.command, spec.args, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
  const handle: CommandRecorderHandle = {
    child,
    spec,
    stderr: "",
    stopping: false,
    armed: false,
    failureReported: false,
    onUnexpectedFailure,
  };
  recorders.set(sessionId, handle);
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    handle.stderr = `${handle.stderr} ${chunk}`.slice(-2_000);
  });
  child.on("error", (error) => {
    handle.stderr = `${handle.stderr} ${error.message}`.slice(-2_000);
    handle.failure = error.message;
    reportUnexpectedFailure(handle);
  });
  child.on("exit", (code, signal) => {
    if (!handle.stopping) {
      handle.failure = `recorder_exited:${code ?? signal ?? "unknown"}`;
      handle.stderr = `${handle.stderr} ${handle.failure}`.slice(-2_000);
      reportUnexpectedFailure(handle);
    }
  });

  await delay(700);
  if (handle.failure || child.exitCode !== null || child.signalCode !== null) {
    recorders.delete(sessionId);
    throw new Error(`${spec.backend}_recording_failed:${detail(handle)}`);
  }
  return spec.path;
}

export function armCommandRecorder(sessionId: string): void {
  const handle = recorders.get(sessionId);
  if (!handle) throw new Error("native_recording_controller_unavailable");
  handle.armed = true;
  reportUnexpectedFailure(handle);
}

export async function stopCommandRecorder(sessionId: string): Promise<void> {
  const handle = recorders.get(sessionId);
  if (!handle) throw new Error("native_recording_controller_unavailable");
  handle.stopping = true;
  try {
    if (handle.spec.stop === "stdin") handle.child.stdin.write("q\n");
    else handle.child.kill("SIGINT");
    await waitForExit(handle.child, 15_000);
  } finally {
    handle.child.stdin.end();
    recorders.delete(sessionId);
  }
}

export async function abortCommandRecorder(sessionId: string): Promise<void> {
  const handle = recorders.get(sessionId);
  if (!handle) return;
  handle.stopping = true;
  recorders.delete(sessionId);
  handle.child.stdin.end();
  if (handle.child.exitCode === null && handle.child.signalCode === null) handle.child.kill("SIGTERM");
  await waitForExit(handle.child, 2_000).catch(() => undefined);
}

function reportUnexpectedFailure(handle: CommandRecorderHandle): void {
  if (!handle.armed || handle.stopping || handle.failureReported) return;
  if (!handle.failure) return;
  handle.failureReported = true;
  void Promise.resolve(handle.onUnexpectedFailure(detail(handle))).catch(() => undefined);
}

function detail(handle: CommandRecorderHandle): string {
  return sanitize(handle.stderr || "recorder process exited before capture started");
}

function waitForExit(child: ChildProcessWithoutNullStreams, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("native_recorder_stop_timeout")), timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function sanitize(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 240) || "unknown_error";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

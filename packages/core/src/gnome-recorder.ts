import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

type RecorderMessage =
  | { event: "started"; success: boolean; path: string }
  | { event: "stopped"; success: boolean }
  | { event: "error"; name: string; message: string }
  | { event: "exit"; code: number | null; signal: NodeJS.Signals | null };

interface Waiter {
  events: Set<RecorderMessage["event"]>;
  resolve: (message: RecorderMessage) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface RecorderHandle {
  child: ChildProcessWithoutNullStreams;
  sessionId: string;
  path: string;
  stderr: string;
  queued: RecorderMessage[];
  waiters: Waiter[];
  stopping: boolean;
  armed: boolean;
  failure?: string;
  failureReported: boolean;
  onUnexpectedFailure: (message: string) => void | Promise<void>;
}

const recorders = new Map<string, RecorderHandle>();

export async function startGnomeRecorder(
  sessionId: string,
  requestedPath: string,
  env: NodeJS.ProcessEnv,
  onUnexpectedFailure: (message: string) => void | Promise<void>,
): Promise<string> {
  if (recorders.has(sessionId)) throw new Error("gnome_recording_already_started");
  const child = spawn("gjs", ["-c", GNOME_RECORDER_HELPER], {
    env: { ...env, TEACH_RECORDING_PATH: requestedPath },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const handle: RecorderHandle = {
    child,
    sessionId,
    path: requestedPath,
    stderr: "",
    queued: [],
    waiters: [],
    stopping: false,
    armed: false,
    failureReported: false,
    onUnexpectedFailure,
  };
  recorders.set(sessionId, handle);
  attachRecorderListeners(handle);

  try {
    const message = await waitForMessage(handle, ["started", "error", "exit"], 15_000);
    if (message.event !== "started" || !message.success) {
      throw new Error(message.event === "error"
        ? `gnome_recording_failed:${sanitize(message.message)}`
        : `gnome_recording_failed:${recorderDetail(handle, message)}`);
    }
    handle.path = message.path || requestedPath;
    await delay(650);
    if (handle.failure || child.exitCode !== null) {
      throw new Error(`gnome_recording_failed:${sanitize(handle.failure || recorderDetail(handle))}`);
    }
    return handle.path;
  } catch (error) {
    await abortGnomeRecorder(sessionId);
    throw error;
  }
}

export function armGnomeRecorder(sessionId: string): void {
  const handle = recorders.get(sessionId);
  if (!handle) throw new Error("gnome_recording_controller_unavailable");
  handle.armed = true;
  reportUnexpectedFailure(handle);
}

export async function stopGnomeRecorder(sessionId: string): Promise<void> {
  const handle = recorders.get(sessionId);
  if (!handle) throw new Error("gnome_recording_controller_unavailable");
  handle.stopping = true;
  try {
    handle.child.stdin.write("stop\n");
    const message = await waitForMessage(handle, ["stopped", "error", "exit"], 15_000);
    if (message.event !== "stopped" || !message.success) {
      throw new Error(message.event === "error"
        ? `gnome_stop_failed:${sanitize(message.message)}`
        : `gnome_stop_failed:${recorderDetail(handle, message)}`);
    }
  } finally {
    handle.child.stdin.end();
    recorders.delete(sessionId);
  }
}

export async function abortGnomeRecorder(sessionId: string): Promise<void> {
  const handle = recorders.get(sessionId);
  if (!handle) return;
  handle.stopping = true;
  recorders.delete(sessionId);
  handle.child.stdin.end();
  if (handle.child.exitCode === null) {
    await Promise.race([
      waitForMessage(handle, ["exit"], 2_000).catch(() => undefined),
      delay(2_100),
    ]);
  }
  if (handle.child.exitCode === null) handle.child.kill("SIGTERM");
}

function attachRecorderListeners(handle: RecorderHandle): void {
  let stdout = "";
  handle.child.stdout.setEncoding("utf8");
  handle.child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
    const lines = stdout.split("\n");
    stdout = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        dispatch(handle, JSON.parse(line) as RecorderMessage);
      } catch {
        dispatch(handle, { event: "error", name: "invalid_helper_output", message: line });
      }
    }
  });
  handle.child.stderr.setEncoding("utf8");
  handle.child.stderr.on("data", (chunk: string) => {
    handle.stderr = `${handle.stderr} ${chunk}`.slice(-2_000);
  });
  handle.child.on("error", (error) => {
    dispatch(handle, { event: "error", name: "helper_process_error", message: error.message });
  });
  handle.child.on("exit", (code, signal) => {
    dispatch(handle, { event: "exit", code, signal });
  });
}

function dispatch(handle: RecorderHandle, message: RecorderMessage): void {
  if (message.event === "error") handle.failure = `${message.name}:${message.message}`;
  if (message.event === "exit" && !handle.stopping) {
    handle.failure ||= recorderDetail(handle, message);
  }
  const waiterIndex = handle.waiters.findIndex((waiter) => waiter.events.has(message.event));
  if (waiterIndex >= 0) {
    const [waiter] = handle.waiters.splice(waiterIndex, 1);
    clearTimeout(waiter.timeout);
    waiter.resolve(message);
  } else {
    handle.queued.push(message);
  }
  reportUnexpectedFailure(handle);
}

function reportUnexpectedFailure(handle: RecorderHandle): void {
  if (!handle.armed || handle.stopping || !handle.failure || handle.failureReported) return;
  handle.failureReported = true;
  void Promise.resolve(handle.onUnexpectedFailure(sanitize(handle.failure))).catch(() => undefined);
}

function waitForMessage(
  handle: RecorderHandle,
  events: RecorderMessage["event"][],
  timeoutMs: number,
): Promise<RecorderMessage> {
  const wanted = new Set(events);
  const queuedIndex = handle.queued.findIndex((message) => wanted.has(message.event));
  if (queuedIndex >= 0) return Promise.resolve(handle.queued.splice(queuedIndex, 1)[0]);
  return new Promise((resolve, reject) => {
    const waiter: Waiter = {
      events: wanted,
      resolve,
      timeout: setTimeout(() => {
        const index = handle.waiters.indexOf(waiter);
        if (index >= 0) handle.waiters.splice(index, 1);
        reject(new Error(`gnome_recorder_timeout:${events.join(",")}`));
      }, timeoutMs),
    };
    handle.waiters.push(waiter);
  });
}

function recorderDetail(handle: RecorderHandle, message?: RecorderMessage): string {
  const event = message?.event === "exit"
    ? `helper_exited:${message.code ?? message.signal ?? "unknown"}`
    : "helper_unavailable";
  return sanitize(`${event} ${handle.stderr}`);
}

function sanitize(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 240) || "unknown_error";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GNOME Shell stops a screencast when the D-Bus sender vanishes. This helper
// deliberately owns one connection from start through stop and listens on stdin
// so a crashed parent closes the pipe and ends capture automatically.
export const GNOME_RECORDER_HELPER = String.raw`
const { Gio, GLib } = imports.gi;

function emit(value) {
  print(JSON.stringify(value));
}

const recordingPath = GLib.getenv("TEACH_RECORDING_PATH");
const loop = GLib.MainLoop.new(null, false);
let stopping = false;
let proxy;

function stop() {
  if (stopping) return;
  stopping = true;
  proxy.call(
    "StopScreencast",
    null,
    Gio.DBusCallFlags.NONE,
    15000,
    null,
    (source, result) => {
      try {
        const [success] = source.call_finish(result).deep_unpack();
        emit({ event: "stopped", success });
      } catch (error) {
        emit({ event: "error", name: "stop_failed", message: String(error.message || error) });
      }
      loop.quit();
    }
  );
}

try {
  proxy = Gio.DBusProxy.new_for_bus_sync(
    Gio.BusType.SESSION,
    Gio.DBusProxyFlags.NONE,
    null,
    "org.gnome.Shell.Screencast",
    "/org/gnome/Shell/Screencast",
    "org.gnome.Shell.Screencast",
    null
  );
  proxy.connect("g-signal", (_proxy, _sender, signalName, parameters) => {
    if (signalName !== "Error") return;
    const [name, message] = parameters.deep_unpack();
    emit({ event: "error", name, message });
    loop.quit();
  });
  if (GLib.getenv("TEACH_RECORDER_PROBE_ONLY") === "1") {
    emit({ event: "probe", success: true });
    imports.system.exit(0);
  }
  const options = {
    "framerate": new GLib.Variant("i", 30),
    "draw-cursor": new GLib.Variant("b", true)
  };
  const result = proxy.call_sync(
    "Screencast",
    new GLib.Variant("(sa{sv})", [recordingPath, options]),
    Gio.DBusCallFlags.NONE,
    15000,
    null
  );
  const [success, path] = result.deep_unpack();
  emit({ event: "started", success, path });
  if (!success) {
    loop.quit();
  } else {
    const input = new Gio.DataInputStream({
      base_stream: new Gio.UnixInputStream({ fd: 0, close_fd: false })
    });
    function readNext() {
      input.read_line_async(GLib.PRIORITY_DEFAULT, null, (stream, asyncResult) => {
        try {
          const [line] = stream.read_line_finish_utf8(asyncResult);
          if (line === null || line.trim() === "stop") stop();
          else readNext();
        } catch (_error) {
          stop();
        }
      });
    }
    readNext();
  }
} catch (error) {
  emit({ event: "error", name: "start_failed", message: String(error.message || error) });
  loop.quit();
}

loop.run();
`;

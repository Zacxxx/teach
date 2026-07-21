import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readdirSync } from "node:fs";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { macosRecorderAvailable } from "./macos-recorder.ts";
import { abortNativeRecorder, armNativeRecorder, startNativeRecorder, stopNativeRecorder } from "./native-recorder.ts";
import { getSession, sessionDir, teachHome, transitionSession, updateSession, writeJsonAtomic } from "./store.ts";
import type { AuthorizationReceipt, NativeRecordingBackend, RecordingBackend, TeachSession } from "./types.ts";
import { windowsRecorderAvailable } from "./windows-recorder.ts";

const activePath = () => join(teachHome(), "active-recording.json");

export async function markReady(id: string): Promise<TeachSession> {
  const now = Date.now();
  const receipt: AuthorizationReceipt = {
    id: randomUUID(),
    issued_at: new Date(now).toISOString(),
    expires_at: new Date(now + 10 * 60_000).toISOString(),
    purpose: "user_directed_workflow_teaching",
    capture: { screen: true, microphone: false, raw_keystrokes: false, clipboard: false },
  };
  const current = await getSession(id);
  if (current.state === "ready") {
    return updateSession(id, "recording_authorization_refreshed", (session) => {
      session.authorization = receipt;
    });
  }
  if (current.state === "failed") {
    return transitionSession(id, "ready", "recording_authorized", (session) => {
      session.authorization = receipt;
    });
  }
  if (current.state !== "draft") throw new Error(`recording_authorization_unavailable:${current.state}`);
  return transitionSession(id, "ready", "recording_authorized", (session) => {
    session.authorization = receipt;
  });
}

export interface RecorderSupport {
  backend: RecordingBackend | "unsupported";
  supported: boolean;
  label: string;
  detail: string;
}

export function probeRecordingSupport(platform: NodeJS.Platform = process.platform): RecorderSupport {
  if (teachRecorderSetting() === "demo") {
    return {
      backend: "demo",
      supported: true,
      label: "Deterministic demo recorder",
      detail: "Synthetic test recording is enabled.",
    };
  }

  if (!commandAvailable("ffmpeg", ["-version"]) || !commandAvailable("ffprobe", ["-version"])) {
    return {
      backend: nativeBackendForPlatform(platform) ?? "unsupported",
      supported: false,
      label: "FFmpeg is required",
      detail: "Install ffmpeg and ffprobe, then reopen Teach. They finalize recordings and extract bounded frames locally.",
    };
  }

  const backend = nativeBackendForPlatform(platform);
  if (backend === "macos") {
    return {
      backend,
      supported: macosRecorderAvailable(),
      label: "macOS screen recorder",
      detail: macosRecorderAvailable()
        ? "Apple screen capture is ready. macOS may request Screen & System Audio Recording permission on first use."
        : "The macOS screencapture utility is unavailable.",
    };
  }
  if (backend === "windows") {
    const supported = windowsRecorderAvailable();
    return {
      backend,
      supported,
      label: "Windows 11 screen recorder",
      detail: supported
        ? "Windows desktop capture is ready. Teach stays visibly in recording mode until you stop."
        : "This FFmpeg build does not provide the Windows gdigrab capture device.",
    };
  }
  if (backend !== "gnome") {
    return {
      backend: "unsupported",
      supported: false,
      label: "Unsupported desktop",
      detail: `Teach does not yet have a native recorder for ${platform}.`,
    };
  }

  const env = graphicalSessionEnvironment();
  const address = env.DBUS_SESSION_BUS_ADDRESS;
  if (!address) {
    return {
      backend: "gnome",
      supported: false,
      label: "GNOME screen recorder",
      detail: "The user session D-Bus address could not be discovered.",
    };
  }

  const result = spawnSync("gdbus", [
    "introspect",
    "--address", address,
    "--dest", "org.gnome.Shell.Screencast",
    "--object-path", "/org/gnome/Shell/Screencast",
  ], { encoding: "utf8", env });
  const helper = spawnSync("gjs", ["--version"], { encoding: "utf8", env });
  const output = `${result.stdout || ""} ${result.stderr || ""} ${helper.stderr || ""}`;
  const supported = result.status === 0
    && helper.status === 0
    && /ScreencastSupported\s*=\s*true/.test(output);
  return {
    backend: "gnome",
    supported,
    label: "GNOME Wayland screen recorder",
    detail: supported
      ? "Native GNOME capture is available. No Codex relaunch or exported display variables are required."
      : `Native GNOME capture is unavailable: ${sanitize(output)}`,
  };
}

export async function startRecording(id: string): Promise<TeachSession> {
  const session = await getSession(id);
  if (session.state !== "ready" || !session.authorization) throw new Error("recording_not_authorized");
  if (Date.parse(session.authorization.expires_at) <= Date.now()) throw new Error("authorization_expired");
  await assertNoActiveRecording();
  const requested = teachRecorderSetting() || "auto";
  const backend: RecordingBackend = requested === "demo" ? "demo" : requireNativeBackend(process.platform);
  let path = join(sessionDir(id), "recording.webm");

  try {
    if (backend === "demo") {
      await generateDemoRecording(path);
    } else {
      const requestedPath = join(sessionDir(id), `recording-${Date.now()}`);
      path = await startNativeRecorder(backend, id, requestedPath, graphicalSessionEnvironment(), async (message) => {
        await abortNativeRecorder(backend, id);
        await markRecordingFailed(id, "native_recorder_failed", message);
      });
    }

    await writeJsonAtomic(activePath(), { session_id: id, backend, path });
    const recording = await transitionSession(id, "recording", "recording_started", (current) => {
      current.recording = {
        backend,
        path,
        started_at: new Date().toISOString(),
      };
    }, { backend });
    if (backend !== "demo") armNativeRecorder(backend, id);
    return recording;
  } catch (error) {
    if (backend !== "demo") await abortNativeRecorder(backend, id);
    await clearActiveRecording(id);
    throw error;
  }
}

export async function stopRecording(id: string): Promise<TeachSession> {
  const session = await getSession(id);
  if (session.state !== "recording" || !session.recording) throw new Error("recording_not_active");
  const active = JSON.parse(await readFile(activePath(), "utf8")) as { session_id: string; backend: string };
  if (active.session_id !== id) throw new Error("another_session_is_recording");
  try {
    if (session.recording.backend !== "demo") await stopNativeRecorder(session.recording.backend, id);
    await waitForFile(session.recording.path);
    validateRecording(session.recording.path);
    const stoppedAt = new Date().toISOString();
    const durationMs = Math.max(0, Date.parse(stoppedAt) - Date.parse(session.recording.started_at));
    const frameResult = extractFrames(session.recording.path, join(sessionDir(id), "frames"));
    await clearActiveRecording(id);
    return transitionSession(id, "processing", "recording_stopped", (current) => {
      if (!current.recording) return;
      current.recording.stopped_at = stoppedAt;
      current.recording.duration_ms = durationMs;
      current.recording.frames_dir = frameResult.directory;
      current.recording.frame_count = frameResult.count;
    }, { duration_ms: durationMs, frame_count: frameResult.count });
  } catch (error) {
    if (session.recording.backend !== "demo") await abortNativeRecorder(session.recording.backend, id);
    await markRecordingFailed(id, "recording_finalize_failed", errorMessage(error));
    throw error;
  }
}

export async function markRecordingFailed(id: string, code: string, message: string): Promise<TeachSession> {
  await clearActiveRecording(id);
  const session = await getSession(id);
  if (session.state === "failed") return session;
  if (session.state !== "recording") return session;
  return transitionSession(id, "failed", "recording_failed", (current) => {
    current.failure = { code: sanitize(code), message: sanitize(message), at: new Date().toISOString() };
  }, { code: sanitize(code) });
}

async function assertNoActiveRecording(): Promise<void> {
  try {
    const active = JSON.parse(await readFile(activePath(), "utf8")) as { session_id: string };
    throw new Error(`recording_already_active:${active.session_id}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function generateDemoRecording(path: string): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true, mode: 0o700 });
  const result = spawnSync("ffmpeg", [
    "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", "testsrc2=size=960x540:rate=10",
    "-t", "1", "-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8",
    "-pix_fmt", "yuv420p", path,
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`demo_recording_failed:${sanitize(result.stderr)}`);
}

function validateRecording(path: string): void {
  const result = spawnSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", path,
  ], { encoding: "utf8" });
  if (result.status !== 0 || !result.stdout.includes("video")) {
    throw new Error(`recording_invalid:${sanitize(result.stderr || result.stdout)}`);
  }
}

async function clearActiveRecording(id: string): Promise<void> {
  try {
    const active = JSON.parse(await readFile(activePath(), "utf8")) as { session_id: string };
    if (active.session_id === id) await rm(activePath(), { force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function extractFrames(recording: string, directory: string): { directory: string; count: number } {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const result = spawnSync("ffmpeg", [
    "-loglevel", "error", "-y", "-i", recording,
    "-vf", "fps=1/3,scale='min(1280,iw)':-2", "-q:v", "3", join(directory, "frame-%04d.jpg"),
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`frame_extraction_failed:${sanitize(result.stderr)}`);
  let count = readdirSync(directory).filter((name) => /^frame-\d+\.jpg$/.test(name)).length;
  if (count === 0) {
    const firstFrame = spawnSync("ffmpeg", [
      "-loglevel", "error", "-y", "-i", recording,
      "-frames:v", "1", "-q:v", "3", join(directory, "frame-0001.jpg"),
    ], { encoding: "utf8" });
    if (firstFrame.status !== 0) throw new Error(`frame_extraction_failed:${sanitize(firstFrame.stderr)}`);
    count = 1;
  }
  return { directory, count };
}

async function waitForFile(path: string): Promise<void> {
  let previousSize = -1;
  let stableChecks = 0;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const info = await stat(path);
      if (info.size > 0 && info.size === previousSize) stableChecks += 1;
      else stableChecks = 0;
      previousSize = info.size;
      if (stableChecks >= 2) return;
    } catch {
      stableChecks = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("recording_file_missing_or_incomplete");
}

function graphicalSessionEnvironment(): NodeJS.ProcessEnv {
  const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
  const runtime = process.env.XDG_RUNTIME_DIR?.trim()
    || (uid === undefined ? undefined : `/run/user/${uid}`);
  const bus = discoverSessionBusAddress(process.env, uid);
  return {
    ...process.env,
    ...(runtime ? { XDG_RUNTIME_DIR: runtime } : {}),
    ...(bus ? { DBUS_SESSION_BUS_ADDRESS: bus } : {}),
  };
}

export function discoverSessionBusAddress(
  env: NodeJS.ProcessEnv = process.env,
  uid: number | undefined = typeof process.getuid === "function" ? process.getuid() : undefined,
): string | undefined {
  const configured = env.DBUS_SESSION_BUS_ADDRESS?.trim();
  if (configured) return configured;
  const runtime = env.XDG_RUNTIME_DIR?.trim() || (uid === undefined ? undefined : `/run/user/${uid}`);
  return runtime ? `unix:path=${runtime}/bus` : undefined;
}

function sanitize(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 240) || "unknown_error";
}

function teachRecorderSetting(): string | undefined {
  return (process.env.TEACH_RECORDER || process.env.TEACH_GPT_RECORDER)?.toLowerCase();
}

export function nativeBackendForPlatform(platform: NodeJS.Platform): NativeRecordingBackend | undefined {
  if (platform === "linux") return "gnome";
  if (platform === "darwin") return "macos";
  if (platform === "win32") return "windows";
  return undefined;
}

function requireNativeBackend(platform: NodeJS.Platform): NativeRecordingBackend {
  const backend = nativeBackendForPlatform(platform);
  if (!backend) throw new Error(`native_recorder_unsupported:${platform}`);
  return backend;
}

function commandAvailable(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, { encoding: "utf8", windowsHide: true });
  return result.status === 0;
}

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { getSession, sessionDir, teachHome, transitionSession, updateSession, writeJsonAtomic } from "./store.ts";
import type { AuthorizationReceipt, TeachSession } from "./types.ts";

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
  if (current.state !== "draft") throw new Error(`recording_authorization_unavailable:${current.state}`);
  return transitionSession(id, "ready", "recording_authorized", (session) => {
    session.authorization = receipt;
  });
}

export interface RecorderSupport {
  backend: "gnome" | "demo";
  supported: boolean;
  label: string;
  detail: string;
}

export function probeRecordingSupport(): RecorderSupport {
  if (process.env.TEACH_GPT_RECORDER?.toLowerCase() === "demo") {
    return {
      backend: "demo",
      supported: true,
      label: "Deterministic demo recorder",
      detail: "Synthetic test recording is enabled.",
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
  const output = `${result.stdout || ""} ${result.stderr || ""}`;
  const supported = result.status === 0 && /ScreencastSupported\s*=\s*true/.test(output);
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
  const requested = process.env.TEACH_GPT_RECORDER?.toLowerCase() || "auto";
  const backend = requested === "demo" ? "demo" : "gnome";
  const path = join(sessionDir(id), "recording.webm");

  if (backend === "demo") {
    await generateDemoRecording(path);
  } else {
    startGnomeRecording(path);
  }

  await writeJsonAtomic(activePath(), { session_id: id, backend, path });
  return transitionSession(id, "recording", "recording_started", (current) => {
    current.recording = {
      backend,
      path,
      started_at: new Date().toISOString(),
    };
  }, { backend });
}

export async function stopRecording(id: string): Promise<TeachSession> {
  const session = await getSession(id);
  if (session.state !== "recording" || !session.recording) throw new Error("recording_not_active");
  const active = JSON.parse(await readFile(activePath(), "utf8")) as { session_id: string; backend: string };
  if (active.session_id !== id) throw new Error("another_session_is_recording");
  if (session.recording.backend === "gnome") stopGnomeRecording();
  await waitForFile(session.recording.path);
  const stoppedAt = new Date().toISOString();
  const durationMs = Math.max(0, Date.parse(stoppedAt) - Date.parse(session.recording.started_at));
  const frameResult = extractFrames(session.recording.path, join(sessionDir(id), "frames"));
  await rm(activePath(), { force: true });
  return transitionSession(id, "processing", "recording_stopped", (current) => {
    if (!current.recording) return;
    current.recording.stopped_at = stoppedAt;
    current.recording.duration_ms = durationMs;
    current.recording.frames_dir = frameResult.directory;
    current.recording.frame_count = frameResult.count;
  }, { duration_ms: durationMs, frame_count: frameResult.count });
}

async function assertNoActiveRecording(): Promise<void> {
  try {
    const active = JSON.parse(await readFile(activePath(), "utf8")) as { session_id: string };
    throw new Error(`recording_already_active:${active.session_id}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function startGnomeRecording(path: string): void {
  const support = probeRecordingSupport();
  if (!support.supported) throw new Error(`gnome_recording_unavailable:${support.detail}`);
  const env = graphicalSessionEnvironment();
  const result = spawnSync("gdbus", [
    "call",
    "--address", env.DBUS_SESSION_BUS_ADDRESS!,
    "--dest",
    "org.gnome.Shell.Screencast",
    "--object-path",
    "/org/gnome/Shell/Screencast",
    "--method",
    "org.gnome.Shell.Screencast.Screencast",
    path,
    "{'framerate': <30>, 'draw-cursor': <true>}",
  ], { encoding: "utf8", env });
  if (result.status !== 0 || !result.stdout.includes("true")) {
    throw new Error(`gnome_recording_failed:${sanitize(result.stderr || result.stdout)}`);
  }
}

function stopGnomeRecording(): void {
  const env = graphicalSessionEnvironment();
  const result = spawnSync("gdbus", [
    "call",
    "--address", env.DBUS_SESSION_BUS_ADDRESS!,
    "--dest",
    "org.gnome.Shell.Screencast",
    "--object-path",
    "/org/gnome/Shell/Screencast",
    "--method",
    "org.gnome.Shell.Screencast.StopScreencast",
  ], { encoding: "utf8", env });
  if (result.status !== 0 || !result.stdout.includes("true")) {
    throw new Error(`gnome_stop_failed:${sanitize(result.stderr || result.stdout)}`);
  }
}

async function generateDemoRecording(path: string): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true, mode: 0o700 });
  const result = spawnSync("ffmpeg", [
    "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=10",
    "-t", "3", "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", path,
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`demo_recording_failed:${sanitize(result.stderr)}`);
}

function extractFrames(recording: string, directory: string): { directory: string; count: number } {
  const mkdirResult = spawnSync("mkdir", ["-p", directory]);
  if (mkdirResult.status !== 0) throw new Error("frame_directory_failed");
  const result = spawnSync("ffmpeg", [
    "-loglevel", "error", "-y", "-i", recording,
    "-vf", "fps=1/3,scale='min(1280,iw)':-2", "-q:v", "3", join(directory, "frame-%04d.jpg"),
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`frame_extraction_failed:${sanitize(result.stderr)}`);
  const countResult = spawnSync("find", [directory, "-maxdepth", "1", "-name", "frame-*.jpg"], { encoding: "utf8" });
  const count = countResult.stdout.split("\n").filter(Boolean).length;
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

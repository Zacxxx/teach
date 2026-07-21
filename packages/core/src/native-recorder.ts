import { abortGnomeRecorder, armGnomeRecorder, startGnomeRecorder, stopGnomeRecorder } from "./gnome-recorder.ts";
import { abortMacosRecorder, armMacosRecorder, startMacosRecorder, stopMacosRecorder } from "./macos-recorder.ts";
import { abortWindowsRecorder, armWindowsRecorder, startWindowsRecorder, stopWindowsRecorder } from "./windows-recorder.ts";
import type { NativeRecordingBackend } from "./types.ts";

export async function startNativeRecorder(
  backend: NativeRecordingBackend,
  sessionId: string,
  requestedPath: string,
  env: NodeJS.ProcessEnv,
  onUnexpectedFailure: (message: string) => void | Promise<void>,
): Promise<string> {
  if (backend === "gnome") return startGnomeRecorder(sessionId, requestedPath, env, onUnexpectedFailure);
  if (backend === "macos") return startMacosRecorder(sessionId, requestedPath, onUnexpectedFailure);
  return startWindowsRecorder(sessionId, requestedPath, onUnexpectedFailure);
}

export function armNativeRecorder(backend: NativeRecordingBackend, sessionId: string): void {
  if (backend === "gnome") armGnomeRecorder(sessionId);
  else if (backend === "macos") armMacosRecorder(sessionId);
  else armWindowsRecorder(sessionId);
}

export async function stopNativeRecorder(backend: NativeRecordingBackend, sessionId: string): Promise<void> {
  if (backend === "gnome") await stopGnomeRecorder(sessionId);
  else if (backend === "macos") await stopMacosRecorder(sessionId);
  else await stopWindowsRecorder(sessionId);
}

export async function abortNativeRecorder(backend: NativeRecordingBackend, sessionId: string): Promise<void> {
  if (backend === "gnome") await abortGnomeRecorder(sessionId);
  else if (backend === "macos") await abortMacosRecorder(sessionId);
  else await abortWindowsRecorder(sessionId);
}

import { existsSync } from "node:fs";
import { abortCommandRecorder, armCommandRecorder, startCommandRecorder, stopCommandRecorder, type CommandRecorderSpec } from "./command-recorder.ts";

const SCREEN_CAPTURE = "/usr/sbin/screencapture";

export function macosRecorderAvailable(): boolean {
  return existsSync(SCREEN_CAPTURE);
}

export function macosRecorderSpec(requestedPath: string): CommandRecorderSpec {
  const path = `${requestedPath}.mov`;
  return {
    backend: "macos",
    command: SCREEN_CAPTURE,
    args: ["-v", "-C", path],
    path,
    stop: "signal",
  };
}

export async function startMacosRecorder(
  sessionId: string,
  requestedPath: string,
  onUnexpectedFailure: (message: string) => void | Promise<void>,
): Promise<string> {
  return startCommandRecorder(sessionId, macosRecorderSpec(requestedPath), onUnexpectedFailure);
}

export const armMacosRecorder = armCommandRecorder;
export const stopMacosRecorder = stopCommandRecorder;
export const abortMacosRecorder = abortCommandRecorder;

import { spawnSync } from "node:child_process";
import { abortCommandRecorder, armCommandRecorder, startCommandRecorder, stopCommandRecorder, type CommandRecorderSpec } from "./command-recorder.ts";

export function windowsRecorderAvailable(): boolean {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-devices"], { encoding: "utf8", windowsHide: true });
  return result.status === 0 && /\bgdigrab\b/i.test(`${result.stdout || ""} ${result.stderr || ""}`);
}

export function windowsRecorderSpec(requestedPath: string): CommandRecorderSpec {
  const path = `${requestedPath}.mkv`;
  return {
    backend: "windows",
    command: "ffmpeg",
    args: [
      "-hide_banner", "-loglevel", "warning", "-y",
      "-f", "gdigrab", "-framerate", "30", "-draw_mouse", "1", "-i", "desktop",
      "-an", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", path,
    ],
    path,
    stop: "stdin",
  };
}

export async function startWindowsRecorder(
  sessionId: string,
  requestedPath: string,
  onUnexpectedFailure: (message: string) => void | Promise<void>,
): Promise<string> {
  return startCommandRecorder(sessionId, windowsRecorderSpec(requestedPath), onUnexpectedFailure);
}

export const armWindowsRecorder = armCommandRecorder;
export const stopWindowsRecorder = stopCommandRecorder;
export const abortWindowsRecorder = abortCommandRecorder;

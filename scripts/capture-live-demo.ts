#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  armGnomeRecorder,
  startGnomeRecorder,
  stopGnomeRecorder,
} from "../packages/core/src/gnome-recorder.ts";

const repo = resolve(import.meta.dir, "..");
const output = join(repo, "documentation", "video", "assets", "live-teach-demo.mp4");
const previewUrl = process.env.TEACH_VIDEO_PREVIEW_URL || "http://127.0.0.1:3142";
const chromium = process.env.TEACH_VIDEO_CHROMIUM || "/snap/bin/chromium";
const sessionId = `teach-hackathon-video-${process.pid}`;
const temporary = await mkdtemp(join(tmpdir(), "teach-live-video-"));
const profile = join(temporary, "chromium-profile");
const rawBase = join(temporary, "desktop-recording");
const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
const runtime = process.env.XDG_RUNTIME_DIR || (uid === undefined ? undefined : `/run/user/${uid}`);
const bus = process.env.DBUS_SESSION_BUS_ADDRESS || (runtime ? `unix:path=${runtime}/bus` : undefined);

if (!runtime || !bus) throw new Error("A GNOME graphical session is required for the live capture.");
await mkdir(profile, { recursive: true });
await mkdir(join(output, ".."), { recursive: true });

async function sleep(milliseconds: number) {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function run(command: string, args: string[]) {
  const child = Bun.spawn([command, ...args], {
    cwd: repo,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) throw new Error(`${command} exited with status ${exitCode}`);
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${previewUrl}/status`);
      if (response.ok) return;
    } catch {
      // The deterministic preview may still be starting.
    }
    await sleep(250);
  }
  throw new Error(`Teach preview is not reachable at ${previewUrl}`);
}

async function waitForCompletion() {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const response = await fetch(`${previewUrl}/status`);
    const status = await response.json() as { complete?: boolean; error?: string; started_at?: string };
    if (status.complete) {
      if (status.error) throw new Error(`Teach autoplay failed: ${status.error}`);
      if (!status.started_at) throw new Error("Teach autoplay did not report its capture start.");
      return status.started_at;
    }
    await sleep(500);
  }
  throw new Error("Teach autoplay did not complete within two minutes.");
}

await waitForPreview();
const url = `${previewUrl}/?theme=dark&autoplay=1&delay=1500`;
let chrome: ReturnType<typeof spawn> | undefined;

let recorderStarted = false;
let rawPath = rawBase;
try {
  const recordingRequestedAt = Date.now();
  rawPath = await startGnomeRecorder(
    sessionId,
    rawBase,
    { ...process.env, XDG_RUNTIME_DIR: runtime, DBUS_SESSION_BUS_ADDRESS: bus },
    (message) => console.error(`GNOME recorder stopped unexpectedly: ${message}`),
  );
  recorderStarted = true;
  armGnomeRecorder(sessionId);
  chrome = spawn(chromium, [
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-sync",
    "--disable-translate",
    "--disable-features=TranslateUI",
    "--window-position=0,0",
    "--window-size=1920,1080",
    "--kiosk",
    url,
  ], {
    cwd: repo,
    detached: true,
    stdio: "ignore",
  });
  const startedAt = await waitForCompletion();
  await sleep(650);
  await stopGnomeRecorder(sessionId);
  recorderStarted = false;

  const trimStart = Math.max(0, (Date.parse(startedAt) - recordingRequestedAt) / 1000);
  await run("ffmpeg", [
    "-loglevel",
    "error",
    "-y",
    "-ss",
    trimStart.toFixed(3),
    "-i",
    rawPath,
    "-t",
    "86",
    "-vf",
    "crop=1920:1080:0:0,fps=30",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ]);
  console.log(`Captured live Teach walkthrough: ${output}`);
} finally {
  if (recorderStarted) await stopGnomeRecorder(sessionId).catch(() => undefined);
  if (chrome?.pid) {
    try {
      process.kill(-chrome.pid, "SIGTERM");
    } catch {
      chrome.kill("SIGTERM");
    }
  }
  await rm(temporary, { recursive: true, force: true });
}

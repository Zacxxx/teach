#!/usr/bin/env bun

import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

type Segment = {
  id: string;
  start: number;
  duration: number;
  image: string;
  narration: string;
  sourceStart?: number;
};

const repo = resolve(import.meta.dir, "..");
const videoDir = join(repo, "documentation", "video");
const assetsDir = join(videoDir, "assets");
const audioDir = join(videoDir, "audio");
const workDir = join(videoDir, "work");
const segments = JSON.parse(
  await readFile(join(videoDir, "segments.json"), "utf8"),
) as Segment[];
const voice = "en-US-AndrewMultilingualNeural";
const refreshVoice = process.argv.includes("--refresh-voice");
const duration = segments.reduce((sum, segment) => sum + segment.duration, 0);

if (duration !== 122) {
  throw new Error(`Expected a 122-second cut, received ${duration} seconds.`);
}

await mkdir(audioDir, { recursive: true });
await mkdir(workDir, { recursive: true });

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function run(command: string, args: string[]) {
  console.log(`\n→ ${command} ${args.slice(0, 5).join(" ")}${args.length > 5 ? " …" : ""}`);
  const process = Bun.spawn([command, ...args], {
    cwd: repo,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await process.exited;
  if (exitCode !== 0) {
    throw new Error(`${command} exited with status ${exitCode}`);
  }
}

function srtTimestamp(seconds: number) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function parseVttTime(value: string) {
  const parts = value.trim().replace(",", ".").split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

type Cue = { start: number; end: number; text: string };

function parseVtt(source: string, offset: number): Cue[] {
  const normalized = source.replaceAll("\r\n", "\n").trim();
  const blocks = normalized.split(/\n\n+/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) continue;
    const [start, endWithSettings] = lines[timingIndex].split("-->").map((part) => part.trim());
    const end = endWithSettings.split(/\s+/)[0];
    cues.push({
      start: offset + parseVttTime(start),
      end: offset + parseVttTime(end),
      text: lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, ""),
    });
  }
  return cues;
}

console.log("Rendering authored cards and proof composite…");
for (const name of ["01-title", "05-workflow", "12-end"]) {
  await run("convert", [
    "-background",
    "none",
    "-density",
    "144",
    join(assetsDir, `${name}.svg`),
    "-resize",
    "1920x1080!",
    join(assetsDir, `${name}.png`),
  ]);
}

await run("convert", [
  "-size",
  "1920x1080",
  "xc:#101011",
  "-font",
  "DejaVu-Sans-Bold",
  "-fill",
  "#ffffff",
  "-pointsize",
  "54",
  "-gravity",
  "northwest",
  "-annotate",
  "+70+80",
  "Open source, public, and verified",
  "-font",
  "DejaVu-Sans",
  "-fill",
  "#9c96a5",
  "-pointsize",
  "25",
  "-annotate",
  "+72+158",
  "Apache-2.0 · inspectable files · native cross-platform paths",
  "(",
  join(assetsDir, "11-repository.png"),
  "-resize",
  "850x570^",
  "-gravity",
  "center",
  "-extent",
  "850x570",
  ")",
  "-gravity",
  "northwest",
  "-geometry",
  "+70+250",
  "-composite",
  "(",
  join(assetsDir, "11-ci.png"),
  "-resize",
  "850x570^",
  "-gravity",
  "center",
  "-extent",
  "850x570",
  ")",
  "-gravity",
  "northwest",
  "-geometry",
  "+1000+250",
  "-composite",
  "-fill",
  "#6d5ef8",
  "-draw",
  "roundrectangle 70,850 505,922 36,36",
  "-fill",
  "#ffffff",
  "-font",
  "DejaVu-Sans-Bold",
  "-pointsize",
  "26",
  "-annotate",
  "+108+897",
  "PUBLIC REPOSITORY",
  "-fill",
  "#23744a",
  "-draw",
  "roundrectangle 1000,850 1615,922 36,36",
  "-fill",
  "#ffffff",
  "-annotate",
  "+1040+897",
  "LINUX · macOS · WINDOWS 11",
  join(assetsDir, "11-proof.png"),
]);

console.log(`Generating narration with ${voice}…`);
for (const segment of segments) {
  const media = join(audioDir, `${segment.id}.mp3`);
  const subtitles = join(audioDir, `${segment.id}.vtt`);
  if (!refreshVoice && (await exists(media)) && (await exists(subtitles))) {
    console.log(`  reuse ${segment.id}`);
    continue;
  }
  await run("uvx", [
    "--from",
    "edge-tts",
    "edge-tts",
    "--voice",
    voice,
    "--rate=-5%",
    "--text",
    segment.narration,
    "--write-media",
    media,
    "--write-subtitles",
    subtitles,
  ]);
}

async function probeDuration(path: string) {
  const process = Bun.spawn(
    [
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      path,
    ],
    { cwd: repo, stdout: "pipe", stderr: "inherit" },
  );
  const output = await new Response(process.stdout).text();
  const exitCode = await process.exited;
  if (exitCode !== 0) throw new Error(`Unable to inspect ${path}`);
  return Number(output.trim());
}

for (const segment of segments) {
  const audioDuration = await probeDuration(join(audioDir, `${segment.id}.mp3`));
  if (audioDuration + 0.15 > segment.duration) {
    throw new Error(
      `${segment.id} narration (${audioDuration.toFixed(2)}s) exceeds its ` +
        `${segment.duration}s scene. Shorten the copy or extend the scene.`,
    );
  }
}

const cues: Cue[] = [];
for (const segment of segments) {
  const vtt = await readFile(join(audioDir, `${segment.id}.vtt`), "utf8");
  cues.push(...parseVtt(vtt, segment.start + 0.15));
}
const srt = `${cues
  .map(
    (cue, index) =>
      `${index + 1}\n${srtTimestamp(cue.start)} --> ${srtTimestamp(cue.end)}\n${cue.text}`,
  )
  .join("\n\n")}\n`;
const captionsPath = join(videoDir, "teach-build-week-demo.srt");
await writeFile(captionsPath, srt);

console.log("Rendering scene clips…");
const clips: string[] = [];
for (const segment of segments) {
  const clip = join(workDir, `${segment.id}.mp4`);
  clips.push(clip);
  const image = join(videoDir, segment.image);
  const audio = join(audioDir, `${segment.id}.mp3`);
  const isVideo = image.endsWith(".mp4");
  const inputArgs = isVideo
    ? ["-ss", String(segment.sourceStart || 0), "-i", image]
    : ["-loop", "1", "-framerate", "30", "-i", image];
  const fades = segment.id === "01-title"
    ? ",fade=t=in:st=0:d=0.35"
    : segment.id === "12-end"
      ? `,fade=t=out:st=${Math.max(0, segment.duration - 0.45).toFixed(2)}:d=0.45`
      : "";
  const filter =
    `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,` +
    `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x101011,` +
    `fps=30${fades}[v];` +
    `[1:a]adelay=150|150,apad,atrim=0:${segment.duration},` +
    `loudnorm=I=-16:TP=-1.5:LRA=7[a]`;
  await run("ffmpeg", [
    "-y",
    ...inputArgs,
    "-i",
    audio,
    "-t",
    String(segment.duration),
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-r",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "2",
    clip,
  ]);
}

const concatPath = join(workDir, "concat.txt");
await writeFile(concatPath, clips.map((clip) => `file '${clip}'`).join("\n") + "\n");
const assembled = join(workDir, "assembled.mp4");
await run("ffmpeg", [
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatPath,
  "-c",
  "copy",
  assembled,
]);

console.log("Mixing captions and subtle original ambient audio…");
const output = join(videoDir, "teach-build-week-demo.mp4");
const subtitleFilter = captionsPath.replaceAll("\\", "\\\\").replaceAll(":", "\\:");
const finalFilter =
  `[0:v]subtitles=${subtitleFilter}:force_style='FontName=DejaVu Sans,FontSize=22,` +
  `PrimaryColour=&H00FFFFFF,OutlineColour=&HCC000000,BorderStyle=3,Outline=1,` +
  `Shadow=0,MarginV=42,Alignment=2'[v];` +
  `[1:a]lowpass=f=1200,volume=0.08,afade=t=in:st=0:d=3,` +
  `afade=t=out:st=${duration - 3}:d=3[music];` +
  `[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[a]`;
await run("ffmpeg", [
  "-y",
  "-i",
  assembled,
  "-f",
  "lavfi",
  "-i",
  `aevalsrc=0.018*sin(2*PI*110*t)+0.010*sin(2*PI*164.81*t)+0.007*sin(2*PI*220*t):s=48000:d=${duration}`,
  "-filter_complex",
  finalFilter,
  "-map",
  "[v]",
  "-map",
  "[a]",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "19",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-movflags",
  "+faststart",
  output,
]);

await rm(join(workDir, "assembled.mp4"), { force: true });
console.log(`\n✓ ${output}`);
console.log(`✓ ${captionsPath}`);

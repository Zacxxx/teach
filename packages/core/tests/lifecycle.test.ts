import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  analyzeSession,
  compileDraftSkill,
  createSession,
  discoverSessionBusAddress,
  getSession,
  markReady,
  markRecordingFailed,
  macosRecorderSpec,
  nativeBackendForPlatform,
  publishSkill,
  startRecording,
  stopRecording,
  teachHome,
  windowsRecorderSpec,
} from "../src/index.ts";

test("graphical session bus is discovered without inherited desktop variables", () => {
  assert.equal(
    discoverSessionBusAddress({}, 1000),
    "unix:path=/run/user/1000/bus",
  );
  assert.equal(
    discoverSessionBusAddress({ DBUS_SESSION_BUS_ADDRESS: "unix:path=/custom/bus" }, 1000),
    "unix:path=/custom/bus",
  );
});

test("the renamed runtime still honors the legacy data-home override", () => {
  const current = process.env.TEACH_HOME;
  const legacy = process.env.TEACH_GPT_HOME;
  delete process.env.TEACH_HOME;
  process.env.TEACH_GPT_HOME = "/tmp/teach-legacy-data";
  try {
    assert.equal(teachHome(), "/tmp/teach-legacy-data");
  } finally {
    if (current === undefined) delete process.env.TEACH_HOME;
    else process.env.TEACH_HOME = current;
    if (legacy === undefined) delete process.env.TEACH_GPT_HOME;
    else process.env.TEACH_GPT_HOME = legacy;
  }
});

test("native recorder selection and command shapes cover all desktop targets", () => {
  assert.equal(nativeBackendForPlatform("linux"), "gnome");
  assert.equal(nativeBackendForPlatform("darwin"), "macos");
  assert.equal(nativeBackendForPlatform("win32"), "windows");
  assert.equal(nativeBackendForPlatform("freebsd"), undefined);

  const mac = macosRecorderSpec("/tmp/teach-recording");
  assert.equal(mac.command, "/usr/sbin/screencapture");
  assert.deepEqual(mac.args, ["-v", "-C", "/tmp/teach-recording.mov"]);
  assert.equal(mac.stop, "signal");

  const windows = windowsRecorderSpec("C:\\Teach\\recording");
  assert.equal(windows.command, "ffmpeg");
  assert.ok(windows.args.includes("gdigrab"));
  assert.ok(windows.args.includes("desktop"));
  assert.ok(windows.args.includes("1"));
  assert.equal(windows.path, "C:\\Teach\\recording.mkv");
  assert.equal(windows.stop, "stdin");
});

test("default session storage follows each host convention", () => {
  const currentHome = process.env.TEACH_HOME;
  const currentLegacyHome = process.env.TEACH_GPT_HOME;
  const currentLocalData = process.env.LOCALAPPDATA;
  delete process.env.TEACH_HOME;
  delete process.env.TEACH_GPT_HOME;
  process.env.LOCALAPPDATA = "C:\\Users\\Test\\AppData\\Local";
  try {
    assert.equal(teachHome("win32"), join("C:\\Users\\Test\\AppData\\Local", "Teach"));
    assert.equal(teachHome("darwin"), join(homedir(), "Library", "Application Support", "Teach"));
  } finally {
    if (currentHome === undefined) delete process.env.TEACH_HOME;
    else process.env.TEACH_HOME = currentHome;
    if (currentLegacyHome === undefined) delete process.env.TEACH_GPT_HOME;
    else process.env.TEACH_GPT_HOME = currentLegacyHome;
    if (currentLocalData === undefined) delete process.env.LOCALAPPDATA;
    else process.env.LOCALAPPDATA = currentLocalData;
  }
});

test("fixture journey records consent, labels the process, and publishes a skill", async () => {
  const root = await mkdtemp(join(tmpdir(), "teach-test-"));
  process.env.TEACH_HOME = join(root, "data");
  process.env.TEACH_SKILLS_HOME = join(root, "skills");
  process.env.TEACH_RECORDER = "demo";
  process.env.TEACH_ANALYZER = "fixture";
  try {
    const created = await createSession({ name: "Prepare handoff", description: "Create the reviewed handoff summary." });
    assert.equal(created.state, "draft");
    const ready = await markReady(created.id);
    assert.equal(ready.authorization?.capture.raw_keystrokes, false);
    assert.equal((await startRecording(created.id)).state, "recording");
    const stopped = await stopRecording(created.id);
    assert.equal(stopped.state, "processing");
    assert.ok((stopped.recording?.frame_count ?? 0) > 0);

    const { analysis } = await analyzeSession(created.id);
    assert.equal(analysis.replayability.status, "replayable");
    assert.equal(analysis.alternatives.length, 0);
    await compileDraftSkill(created.id);
    const published = await publishSkill(created.id);
    assert.equal(published.state, "published");
    assert.match(published.published_skill?.name ?? "", /^prepare-handoff/);

    const skill = await readFile(join(published.published_skill!.path, "SKILL.md"), "utf8");
    assert.match(skill, /^---\nname: prepare-handoff/m);
    assert.match(skill, /Output contract/);

    const events = await readFile(join(process.env.TEACH_HOME, "sessions", created.id, "events.jsonl"), "utf8");
    assert.doesNotMatch(events, /raw_keystroke|recording\.webm/);
    assert.match(events, /recording_authorized/);
    assert.match(events, /skill_published/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("recording cannot start before a separate authorization transition", async () => {
  const root = await mkdtemp(join(tmpdir(), "teach-test-"));
  process.env.TEACH_HOME = root;
  process.env.TEACH_RECORDER = "demo";
  try {
    const session = await createSession();
    await assert.rejects(startRecording(session.id), /recording_not_authorized/);
    assert.equal((await getSession(session.id)).state, "draft");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a failed capture is recoverable without leaving the global recording lock", { timeout: 12_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "teach-test-"));
  process.env.TEACH_HOME = root;
  process.env.TEACH_RECORDER = "demo";
  try {
    const session = await createSession();
    await markReady(session.id);
    await startRecording(session.id);
    const failed = await markRecordingFailed(session.id, "test_failure", "The test recorder stopped.");
    assert.equal(failed.state, "failed");
    assert.equal(failed.failure?.code, "test_failure");

    await markReady(session.id);
    assert.equal((await startRecording(session.id)).state, "recording");
    assert.equal((await stopRecording(session.id)).state, "processing");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

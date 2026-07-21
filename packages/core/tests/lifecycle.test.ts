import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  analyzeSession,
  compileDraftSkill,
  createSession,
  discoverSessionBusAddress,
  getSession,
  markReady,
  publishSkill,
  startRecording,
  stopRecording,
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

test("fixture journey records consent, labels the process, and publishes a skill", async () => {
  const root = await mkdtemp(join(tmpdir(), "teach-gpt-test-"));
  process.env.TEACH_GPT_HOME = join(root, "data");
  process.env.TEACH_GPT_SKILLS_HOME = join(root, "skills");
  process.env.TEACH_GPT_RECORDER = "demo";
  process.env.TEACH_GPT_ANALYZER = "fixture";
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

    const events = await readFile(join(process.env.TEACH_GPT_HOME, "sessions", created.id, "events.jsonl"), "utf8");
    assert.doesNotMatch(events, /raw_keystroke|recording\.webm/);
    assert.match(events, /recording_authorized/);
    assert.match(events, /skill_published/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("recording cannot start before a separate authorization transition", async () => {
  const root = await mkdtemp(join(tmpdir(), "teach-gpt-test-"));
  process.env.TEACH_GPT_HOME = root;
  process.env.TEACH_GPT_RECORDER = "demo";
  try {
    const session = await createSession();
    await assert.rejects(startRecording(session.id), /recording_not_authorized/);
    assert.equal((await getSession(session.id)).state, "draft");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

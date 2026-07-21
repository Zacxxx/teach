#!/usr/bin/env bun
import { analyzeSession, compileDraftSkill, createSession, getAnalysis, getSession, listSessions, markReady, publishSkill, startRecording, stopRecording } from "./index.ts";

const [command, ...args] = process.argv.slice(2);

async function main(): Promise<void> {
  if (command === "demo") {
    process.env.TEACH_ANALYZER ||= "fixture";
    process.env.TEACH_RECORDER ||= "demo";
    const session = await createSession({
      name: "Export a reviewed workflow summary",
      description: "Judge-safe demonstration of the full Teach lifecycle.",
    });
    await markReady(session.id);
    await startRecording(session.id);
    await stopRecording(session.id);
    const { analysis } = await analyzeSession(session.id);
    await compileDraftSkill(session.id);
    const published = await publishSkill(session.id);
    console.log(JSON.stringify({
      ok: true,
      session_id: session.id,
      state: published.state,
      replayability: analysis.replayability.status,
      session_path: `${process.env.TEACH_HOME}/sessions/${session.id}`,
      skill: published.published_skill,
    }, null, 2));
    return;
  }
  if (command === "list") {
    console.log(JSON.stringify(await listSessions(), null, 2));
    return;
  }
  if (command === "show" && args[0]) {
    const session = await getSession(args[0]);
    const analysis = session.analysis_path ? await getAnalysis(args[0]) : undefined;
    console.log(JSON.stringify({ session, analysis }, null, 2));
    return;
  }
  throw new Error("usage: teach demo | list | show <session-id>");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

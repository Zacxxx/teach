import {
  analyzeSession,
  compileDraftSkill,
  getSession,
  markReady,
  optimizeAnalysis,
  publishSkill,
  reviewAnalysis,
  startRecording,
  stopRecording,
} from "@teach/core";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { action?: string; patch?: Record<string, unknown> };
  try {
    switch (body.action) {
      case "start":
        await markReady(id);
        await startRecording(id);
        break;
      case "stop":
        await stopRecording(id);
        break;
      case "analyze":
        await analyzeSession(id);
        await compileDraftSkill(id);
        break;
      case "optimize":
        await optimizeAnalysis(id);
        break;
      case "review":
        await reviewAnalysis(id, body.patch ?? {});
        await compileDraftSkill(id);
        break;
      case "publish":
        await publishSkill(id);
        break;
      default:
        throw new Error("unknown_action");
    }
    return NextResponse.json({ session: await getSession(id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "request_failed" },
      { status: 400 },
    );
  }
}

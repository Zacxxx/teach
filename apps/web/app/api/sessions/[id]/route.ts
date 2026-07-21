import { getAnalysis, getSession } from "@teach/core";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getSession(id);
    const analysis = session.analysis_path ? await getAnalysis(id) : null;
    return NextResponse.json({ session, analysis });
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "request_failed" },
    { status: 400 },
  );
}

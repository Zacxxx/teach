import { createSession, listSessions } from "@teach-gpt/core";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ sessions: await listSessions() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: string; description?: string };
  return NextResponse.json({ session: await createSession(body) }, { status: 201 });
}

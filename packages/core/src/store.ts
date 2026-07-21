import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import {
  appendFile,
  chmod,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { BeginInput, TeachEvent, TeachSession, TeachState } from "./types.ts";

const transitions: Record<TeachState, TeachState[]> = {
  draft: ["ready"],
  ready: ["recording"],
  recording: ["processing", "failed"],
  processing: ["review", "failed"],
  review: ["processing", "published"],
  published: [],
  failed: ["ready"],
};

export function teachHome(platform: NodeJS.Platform = process.platform): string {
  const configured = process.env.TEACH_HOME?.trim() || process.env.TEACH_GPT_HOME?.trim();
  if (configured) return configured;
  if (platform === "win32") {
    const localData = process.env.LOCALAPPDATA?.trim() || join(homedir(), "AppData", "Local");
    return join(localData, "Teach");
  }
  if (platform === "darwin") return join(homedir(), "Library", "Application Support", "Teach");
  const dataHome = process.env.XDG_DATA_HOME?.trim() || join(homedir(), ".local", "share");
  const preferred = join(dataHome, "teach");
  const legacy = join(dataHome, "teach-gpt");
  return existsSync(preferred) || !existsSync(legacy) ? preferred : legacy;
}

export function sessionDir(id: string): string {
  assertId(id);
  return join(teachHome(), "sessions", id);
}

export async function ensureHome(): Promise<void> {
  await mkdir(join(teachHome(), "sessions"), { recursive: true, mode: 0o700 });
  await chmod(teachHome(), 0o700);
  await chmod(join(teachHome(), "sessions"), 0o700);
}

export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temp = join(dirname(path), `.${randomUUID()}.tmp`);
  const handle = await open(temp, "wx", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temp, path);
  await chmod(path, 0o600);
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function createSession(input: BeginInput = {}): Promise<TeachSession> {
  await ensureHome();
  const id = randomUUID();
  const now = new Date().toISOString();
  const session: TeachSession = {
    schema_version: 1,
    id,
    state: "draft",
    created_at: now,
    updated_at: now,
    ...(cleanText(input.name, 80) ? { name: cleanText(input.name, 80) } : {}),
    ...(cleanText(input.description, 500)
      ? { description: cleanText(input.description, 500) }
      : {}),
  };
  await mkdir(sessionDir(id), { recursive: false, mode: 0o700 });
  await writeJsonAtomic(join(sessionDir(id), "session.json"), session);
  await appendEvent(session, "session_created", undefined, "draft", {
    metadata_supplied: Boolean(session.name || session.description),
  });
  return session;
}

export async function getSession(id: string): Promise<TeachSession> {
  return readJson<TeachSession>(join(sessionDir(id), "session.json"));
}

export async function listSessions(): Promise<TeachSession[]> {
  await ensureHome();
  const entries = await readdir(join(teachHome(), "sessions"), { withFileTypes: true });
  const sessions = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => getSession(entry.name).catch(() => null)),
  );
  return sessions
    .filter((session): session is TeachSession => session !== null)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function transitionSession(
  id: string,
  next: TeachState,
  type: string,
  mutate?: (session: TeachSession) => void,
  metadata?: TeachEvent["metadata"],
): Promise<TeachSession> {
  return withLock(id, async () => {
    const session = await getSession(id);
    if (!transitions[session.state].includes(next)) {
      throw new Error(`invalid_transition:${session.state}->${next}`);
    }
    const previous = session.state;
    session.state = next;
    session.updated_at = new Date().toISOString();
    delete session.failure;
    mutate?.(session);
    await writeJsonAtomic(join(sessionDir(id), "session.json"), session);
    await appendEvent(session, type, previous, next, metadata);
    return session;
  });
}

export async function updateSession(
  id: string,
  type: string,
  mutate: (session: TeachSession) => void,
  metadata?: TeachEvent["metadata"],
): Promise<TeachSession> {
  return withLock(id, async () => {
    const session = await getSession(id);
    mutate(session);
    session.updated_at = new Date().toISOString();
    await writeJsonAtomic(join(sessionDir(id), "session.json"), session);
    await appendEvent(session, type, session.state, session.state, metadata);
    return session;
  });
}

export async function appendEvent(
  session: TeachSession,
  type: string,
  from_state?: TeachState,
  to_state?: TeachState,
  metadata?: TeachEvent["metadata"],
): Promise<void> {
  const event: TeachEvent = {
    schema_version: 1,
    id: randomUUID(),
    session_id: session.id,
    at: new Date().toISOString(),
    type,
    idempotency_key: randomUUID(),
    ...(from_state ? { from_state } : {}),
    ...(to_state ? { to_state } : {}),
    ...(metadata ? { metadata } : {}),
  };
  const path = join(sessionDir(session.id), "events.jsonl");
  await appendFile(path, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600);
}

async function withLock<T>(id: string, action: () => Promise<T>): Promise<T> {
  const lock = join(sessionDir(id), ".lock");
  let handle;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      handle = await open(lock, "wx", 0o600);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const info = await stat(lock).catch(() => null);
      if (info && Date.now() - info.mtimeMs > 30_000) await rm(lock, { force: true });
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  if (!handle) throw new Error("session_busy");
  try {
    return await action();
  } finally {
    await handle.close();
    await rm(lock, { force: true });
  }
}

function assertId(id: string): void {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("invalid_session_id");
}

function cleanText(value: string | undefined, limit: number): string | undefined {
  // Control characters cannot be persisted in user-editable labels.
  // eslint-disable-next-line no-control-regex
  const clean = value?.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return clean ? clean.slice(0, limit) : undefined;
}

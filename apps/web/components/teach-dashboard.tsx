"use client";

import {
  ArrowRight,
  Check,
  CircleStop,
  Clock3,
  FileCode2,
  Lightbulb,
  MonitorUp,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useCallback, useMemo, useState } from "react";

type State = "draft" | "ready" | "recording" | "processing" | "review" | "published" | "failed";
type Session = {
  id: string;
  state: State;
  name?: string;
  description?: string;
  created_at: string;
  recording?: { duration_ms?: number };
  published_skill?: { name: string; path: string };
};
type Analysis = {
  generated_at: string;
  name: string;
  description: string;
  goal: string;
  category: string;
  software_used: string[];
  duration_ms: number;
  steps: Array<{ order: number; title: string; instruction: string; verification: string }>;
  replayability: { status: string; reasons: string[]; missing_capabilities: string[] };
  alternatives: Array<{ name: string; description: string; verification_status: string }>;
};

export function TeachDashboard({ initialSessions, initialAnalysis }: { initialSessions: Session[]; initialAnalysis: Analysis | null }) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [selected, setSelected] = useState<string | undefined>(initialSessions[0]?.id);
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/sessions", { cache: "no-store" });
    const body = (await response.json()) as { sessions: Session[] };
    setSessions(body.sessions);
    if (!selected && body.sessions[0]) setSelected(body.sessions[0].id);
  }, [selected]);

  const inspect = useCallback(async (id: string) => {
    const response = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
    const body = (await response.json()) as { analysis: Analysis | null };
    setAnalysis(body.analysis);
  }, []);

  const active = useMemo(() => sessions.find((session) => session.id === selected), [selected, sessions]);

  async function select(id: string) {
    setSelected(id);
    setAnalysis(null);
    await inspect(id);
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy("create"); setError(undefined);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name || undefined, description: description || undefined }),
      });
      const body = (await response.json()) as { session: Session; error?: string };
      if (!response.ok) throw new Error(body.error || "create_failed");
      setName(""); setDescription(""); setSelected(body.session.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "create_failed");
    } finally { setBusy(undefined); }
  }

  async function action(kind: string, patch?: Record<string, unknown>) {
    if (!active) return;
    setBusy(kind); setError(undefined);
    try {
      const response = await fetch(`/api/sessions/${active.id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: kind, patch }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || `${kind}_failed`);
      await refresh(); await inspect(active.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${kind}_failed`);
    } finally { setBusy(undefined); }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Teach GPT home"><span className="brand-mark">T<span /></span><strong>Teach GPT</strong></a>
        <span className="open-source"><Sparkles size={14} /> Open source · Linux first</span>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> SHOW ONCE. REUSE WITH CODEX.</div>
        <h1>Teach the process.<br /><em>Keep the judgment.</em></h1>
        <p>Record a workflow with visible consent. GPT-5.6 turns it into a labeled, editable process. You decide whether it becomes a skill.</p>
        <div className="trust-row"><span><ShieldCheck size={17} /> Local artifacts</span><span><MonitorUp size={17} /> Native Linux capture</span><span><FileCode2 size={17} /> Portable skills</span></div>
      </section>

      <section className="workspace">
        <aside className="sessions-panel">
          <div className="panel-heading"><div><small>LIBRARY</small><h2>Taught workflows</h2></div><button className="icon-button" onClick={() => void refresh()} aria-label="Refresh"><RefreshCw size={16} /></button></div>
          <div className="session-list">
            {sessions.map((session) => (
              <button key={session.id} className={`session-row ${selected === session.id ? "selected" : ""}`} onClick={() => void select(session.id)}>
                <span className={`state-dot ${session.state}`} />
                <span><strong>{session.name || "Untitled teaching"}</strong><small>{label(session.state)} · {new Date(session.created_at).toLocaleDateString()}</small></span>
                <ArrowRight size={15} />
              </button>
            ))}
            {sessions.length === 0 && <p className="empty">Nothing taught yet. Start with a short, complete workflow.</p>}
          </div>
        </aside>

        <section className="control-panel" aria-live="polite">
          {!active ? (
            <form className="start-card" onSubmit={create}>
              <small>NEW TEACHING</small><h2>What are you about to show?</h2>
              <p>Both fields are optional. GPT-5.6 can propose them after the recording.</p>
              <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Prepare the weekly handoff" /></label>
              <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should stay true when Codex repeats it?" /></label>
              <button className="primary" disabled={busy === "create"}><Play size={17} /> {busy === "create" ? "Creating…" : name || description ? "Create teaching" : "Skip and create teaching"}</button>
            </form>
          ) : (
            <SessionControl key={`${active.id}:${analysis?.generated_at ?? "none"}`} session={active} analysis={analysis} busy={busy} action={action} />
          )}
          {error && <div className="error" role="alert">{error}</div>}
          {active && <button className="new-session" onClick={() => { setSelected(undefined); setAnalysis(null); }}>+ New teaching</button>}
        </section>
      </section>

      <footer><span>Independent open-source project for OpenAI Build Week 2026.</span><a href="https://github.com/Zacxxx/teach-gpt">GitHub <ArrowRight size={14} /></a></footer>
    </main>
  );
}

function SessionControl({ session, analysis, busy, action }: { session: Session; analysis: Analysis | null; busy?: string; action: (kind: string, patch?: Record<string, unknown>) => Promise<void> }) {
  const [edit, setEdit] = useState({ name: analysis?.name || "", description: analysis?.description || "", goal: analysis?.goal || "" });

  if (session.state === "draft") return (
    <div className="ready-card">
      <div className="state-number">01</div><small>READY WHEN YOU ARE</small><h2>{session.name || "Untitled teaching"}</h2>
      <p>Starting creates a short-lived authorization receipt and invokes GNOME’s visible screen recorder. Microphone, clipboard, and raw keystrokes stay off.</p>
      <div className="capture-scope"><span><Check size={15} /> Screen and cursor</span><span><Check size={15} /> Local storage</span><span className="off">× Raw keystroke log</span></div>
      <button className="record-button" disabled={Boolean(busy)} onClick={() => void action("start")}><span /> {busy === "start" ? "Starting…" : "I’m ready — start recording"}</button>
    </div>
  );

  if (session.state === "recording") return (
    <div className="recording-card">
      <div className="recording-orbit"><span /></div><small>RECORDING NOW</small><h2>Show the workflow naturally.</h2>
      <p>Finish the task completely, then stop here or tell Codex “I’m done.”</p>
      <button className="stop-button" disabled={Boolean(busy)} onClick={() => void action("stop")}><CircleStop size={19} /> {busy === "stop" ? "Finalizing…" : "End recording"}</button>
    </div>
  );

  if (session.state === "processing") return (
    <div className="processing-card"><Sparkles size={29} /><small>RECORDING READY</small><h2>Turn the demonstration into a process.</h2><p>GPT-5.6 will inspect bounded local frames and return schema-constrained labels. Deterministic checks reassess replayability.</p><button className="primary" disabled={Boolean(busy)} onClick={() => void action("analyze")}><Sparkles size={17} /> {busy === "analyze" ? "Analyzing…" : "Analyze with GPT-5.6"}</button></div>
  );

  if (session.state === "published") return (
    <div className="published-card"><div className="published-check"><Check size={30} /></div><small>SKILL PUBLISHED</small><h2>${session.published_skill?.name}</h2><p>The reviewed process is available as a direct Codex skill. Start a new task so the skill index refreshes.</p><code>{session.published_skill?.path}</code></div>
  );

  if (session.state === "review" && analysis) return (
    <div className="review-card">
      <div className="review-heading"><div><small>REVIEW DRAFT</small><h2>{analysis.name}</h2></div><span className={`replay ${analysis.replayability.status}`}>{analysis.replayability.status.replace("_", " ")}</span></div>
      <div className="label-strip"><span><Clock3 size={14} /> {formatDuration(analysis.duration_ms)}</span><span><MonitorUp size={14} /> {analysis.software_used.join(", ")}</span><span>{analysis.category}</span></div>
      <div className="edit-grid"><label>Name<input value={edit.name} onChange={(event) => setEdit({ ...edit, name: event.target.value })} /></label><label>Description<textarea value={edit.description} onChange={(event) => setEdit({ ...edit, description: event.target.value })} /></label><label>Goal<textarea value={edit.goal} onChange={(event) => setEdit({ ...edit, goal: event.target.value })} /></label></div>
      <button className="secondary" disabled={Boolean(busy)} onClick={() => void action("review", edit)}>Save review edits</button>
      <div className="steps"><h3>Learned steps</h3>{analysis.steps.map((step) => <article key={step.order}><span>{String(step.order).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.instruction}</p><small>Verify: {step.verification}</small></div></article>)}</div>
      <div className="replay-note"><ShieldCheck size={18} /><div><strong>Replayability is checked, not guessed.</strong><p>{analysis.replayability.reasons.join(" ")}</p></div></div>
      {analysis.alternatives.length > 0 && <div className="alternatives"><h3>Same-output alternatives</h3>{analysis.alternatives.map((alternative) => <article key={alternative.name}><Lightbulb size={17} /><div><strong>{alternative.name} <small>{alternative.verification_status}</small></strong><p>{alternative.description}</p></div></article>)}</div>}
      <div className="review-actions"><button className="secondary" disabled={Boolean(busy)} onClick={() => void action("optimize")}><Lightbulb size={16} /> Suggest exact-output alternative</button><button className="primary" disabled={Boolean(busy)} onClick={() => void action("publish")}><FileCode2 size={16} /> Publish skill</button></div>
    </div>
  );

  return <div className="processing-card"><small>{session.state.toUpperCase()}</small><h2>This session needs attention.</h2><p>Inspect it through the Teach plugin for recovery details.</p></div>;
}

function label(state: State) { return ({ draft: "Waiting", ready: "Ready", recording: "Recording", processing: "Processing", review: "Review", published: "Published", failed: "Failed" } as const)[state]; }
function formatDuration(ms: number) { const seconds = Math.round(ms / 1000); return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }

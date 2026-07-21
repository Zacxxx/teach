# Architecture

## System context

```mermaid
flowchart LR
    U["User"] --> C["Codex + Teach skill"]
    C --> M["Teach MCP server"]
    U --> W["Local review dashboard"]
    W --> K["Teach core package"]
    M --> K
    K --> R["GNOME recorder adapter"]
    K --> F["File workspace"]
    K --> X["codex exec / GPT-5.6"]
    K --> S["Generated Codex skill"]
```

## Components

### `plugins/teach-gpt`

Installable Codex bundle containing the `$teach` orchestration skill, MCP
configuration, manifest, and product assets. It does not hold user recordings.

### `packages/core`

Provider-independent lifecycle, filesystem store, recorder adapters, analyzer,
review patches, replayability checks, and skill compiler. This is the
self-hostable foundation other interfaces can reuse.

### `packages/mcp`

Thin stdio MCP server exposing typed tools for begin, start, stop, analyze,
review, optimize, publish, list, and inspect. It delegates all state changes to
core and returns the next expected user action.

### `apps/web`

Loopback-only Next.js dashboard. It provides visible recording controls and a
review UI over the same core package. It is not a hosted multi-user service.

## File workspace

`TEACH_GPT_HOME` defaults to `$XDG_DATA_HOME/teach-gpt` or
`~/.local/share/teach-gpt`. Directories use mode `0700`; sensitive artifacts use
`0600`. JSON is written to a same-directory temporary file, synced, and renamed.
The event log stores lifecycle metadata only and never raw screen or text data.

## State machine

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> ready
    ready --> recording
    recording --> processing
    processing --> review
    processing --> failed
    review --> processing: reanalyze or optimize
    review --> published
    failed --> ready: retry
```

Invalid transitions fail closed. Every mutating operation includes a generated
idempotency key in the event log.

## Recording

The GNOME adapter calls `org.gnome.Shell.Screencast`, which displays the native
desktop recording indicator. Stop calls `StopScreencast`; `ffmpeg` then samples
bounded frames. The adapter does not register a keyboard event listener. A demo
adapter creates a synthetic clip for tests and judging.

Future adapters implement the same start/stop contract for KDE/Portal, wlroots,
and macOS without changing analysis or storage.

## Analysis and deterministic validation

The default analyzer launches `codex exec` in the session directory with a
read-only sandbox, GPT-5.6, a strict output schema, and an explicit output file.
Only the validated final JSON becomes `analysis.json`. Provider event streams
are not copied into the audit log.

Deterministic code then checks required fields, capability claims, schema
version, step ordering, output-verification presence, and skill paths. Model
output remains a review draft until explicit publication.

## Publishing

The compiler renders human-readable `SKILL.md` plus analysis provenance. Drafts
remain inside the session. Publication copies a validated, collision-safe skill
directory to `TEACH_GPT_SKILLS_HOME` or `~/.agents/skills`, records its version,
and returns the direct `$skill-name` invocation. A new Codex task is recommended
so the initial skill index is refreshed.

## Trust boundary

The dashboard and MCP server run locally. There is no inbound network listener
except the explicitly started loopback dashboard. Raw artifacts are never sent
to Devpost, GitHub, or an OpenAI API by the core package. The default analyzer
uses the user's configured Codex host; its sandbox and account policy still
apply.


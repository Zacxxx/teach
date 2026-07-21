# Teach GPT

Teach GPT is an open-source, Linux-first Codex plugin that learns a reusable
skill from a workflow you demonstrate. You describe the goal or skip naming,
approve a visible recording, perform the task, stop naturally or from the local
control surface, review a structured process draft, and publish it as a normal
Codex skill.

This project was created for **OpenAI Build Week 2026** with Codex and GPT-5.6.

## Why it exists

OpenAI's Record & Replay validates the idea of turning demonstrations into
skills, but its initial release is macOS-only, requires Computer Use, and is not
initially available in the EEA, United Kingdom, or Switzerland. Teach GPT is a
separate implementation with a different product boundary:

- **Open source:** Apache-2.0 code, inspectable storage, and portable skill output.
- **Linux first:** native GNOME Wayland recording today, with explicit recorder adapters.
- **Deep labelisation:** goal, steps, software, duration, inputs, outputs, risks,
  variability, replayability, blockers, and verification criteria.
- **Reviewable by design:** recording consent, local artifacts, editable drafts,
  capability-based replay labels, and versioned publishing.
- **Product UX:** a local dashboard and recording controls instead of a prompt-only flow.
- **Optimization with proof:** alternatives are separated from verified
  output-equivalent methods.

Teach GPT is not affiliated with or a replacement for OpenAI Record & Replay.

## Architecture in one minute

The Codex plugin bundles a `$teach` skill and a local MCP server. The server
uses `@teach-gpt/core`, a self-hostable package that stores each session as a
plain directory:

```text
~/.local/share/teach-gpt/sessions/<session-id>/
  session.json
  events.jsonl
  recording.webm
  frames/
  analysis.json
  draft-skill/<skill-name>/SKILL.md
```

Writes are atomic, events are append-only metadata, and raw recordings never
enter logs. The default analyzer runs sandboxed `codex exec` with GPT-5.6 over
local frames and a strict JSON schema. A deterministic fixture analyzer powers
the no-credentials judge demo.

## Requirements

- Linux; GNOME Wayland is the supported native recording target for v0.1.
- Bun 1.3.3 or newer.
- Codex Desktop or Codex CLI for plugin usage and GPT-5.6 analysis.
- `ffmpeg` for keyframe extraction.
- GNOME Shell Screencast D-Bus support for native recording.

Other Linux desktops can use `TEACH_GPT_RECORDER=demo` today or add a recorder
adapter without changing the session format.

## Run without rebuilding

The repository includes a deterministic judge path with synthetic video and no
API key:

```bash
git clone https://github.com/Zacxxx/teach-gpt.git
cd teach-gpt
bun install --frozen-lockfile
make demo
```

The command prints the created session, analysis, and generated skill paths.
It never records the desktop and writes only to a temporary directory.

## Run the local dashboard

```bash
cp .env.example .env.local
bun install --frozen-lockfile
make dev
```

Open `http://127.0.0.1:3141`. Keep the dashboard loopback-only because it can
control local recording and access recording metadata.

## Install the Codex plugin

Add this repository marketplace, install the plugin, and start a new task:

```bash
codex plugin marketplace add "$PWD"
codex plugin add teach-gpt@teach-gpt
```

Then invoke `@teach-gpt`, `$teach`, or say "teach this workflow." The expected
conversation is:

1. Optionally name and describe the workflow.
2. Confirm readiness and grant the visible recording permission.
3. Demonstrate the workflow.
4. Say "I'm done" or use **End recording** in the dashboard.
5. Review labels and steps; optionally request equivalent alternatives.
6. Publish the generated skill and use it in a new Codex task.

## Fresh verification

```bash
make check
make demo
```

The plugin manifest, Teach skill, TypeScript, tests, production web build, and
deterministic end-to-end path are all checked.

## How Codex and GPT-5.6 were used

Codex performed repository archaeology on Corridor, extracted and verified the
Build Week checklist, designed the product boundary, implemented the file
workspace, plugin, MCP tools, dashboard, tests, and public delivery workflow.
The prompt and decision history is preserved in
[`documentation/prompt-library.md`](documentation/prompt-library.md) and
[`documentation/devlog.md`](documentation/devlog.md).

At runtime, GPT-5.6 analyzes locally extracted recording frames through
`codex exec` and returns a schema-constrained process model. Deterministic code
then validates state transitions, replayability evidence, skill structure, and
publishing paths. Model output cannot silently publish or execute a workflow.

## Documentation

- [Devlog](documentation/devlog.md)
- [Prompt library](documentation/prompt-library.md)
- [Design](documentation/design.md)
- [Architecture](documentation/architecture.md)
- [Build Week submission checklist](documentation/build-week-submission.md)

## License

Apache-2.0. See [LICENSE](LICENSE).


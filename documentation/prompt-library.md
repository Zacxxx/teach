# Prompt library

This file preserves the project-defining prompts and the runtime prompt
templates used by Teach GPT. Secrets, system instructions, and unrelated
conversation content are intentionally excluded.

## Inception prompt - 2026-07-21

> Let's create a new repo named codex/teach based on the current codebase.
> Create a plugin for Codex that allows the user to launch a teach me mode.
> The flow should optionally name the process, explicitly start recording,
> record the user's action and screen, stop naturally or with a button, analyze
> and store the recording, label the goal and steps, assess whether it can be
> replayed, offer review and equivalent optimization, then expose the result as
> a reusable skill.

The original prompt also required a self-hosted foundational package for
recording, storage, and capabilities Codex does not natively provide.

## Build Week refinement prompt - 2026-07-21

> teach-gpt is fine. Keep the multi-commit structure, use the installed Devpost
> plugin to finalize the OpenAI Build Week submission, make the repository
> public, differentiate explicitly from Record & Replay through open source,
> Linux, labelisation, UX and UI, prefer a simpler Codex-fitting store over
> SQLite, and add documentation for the devlog, prompt library, design, and
> architecture.

## Installed-flow feedback prompt - 2026-07-21

> The buttons did not appear, although Codex has a native way to expose UI.
> No package was installed, the recording failed, and the UX is poor.

This feedback led to the embedded MCP Apps interface, self-contained Linux
runtime, and recorder session-bus discovery work documented in the devlog.

## Runtime recording-analysis prompt

The analyzer receives this template together with `session.json`, sampled
frames, and a strict JSON schema:

```text
You are Teach GPT's workflow analyst. Inspect only the provided local teaching
session and sampled frames. Describe the process, never judge the person.
Never infer secrets, hidden text, health, emotion, productivity, or intent.

Produce one exact JSON object matching process-analysis.schema.json. Identify
the goal, observable output contract, ordered steps, decision points, variable
inputs, software, duration, risks, and verification. Replayability must be one
of replayable, assist_only, unsupported, or unknown. Treat it as unknown unless
the available evidence and declared Codex capabilities support every required
action. Do not claim an alternative is output-equivalent unless its verifier
can compare the same output contract.
```

## Runtime optimization prompt

```text
Read analysis.json. Suggest only methods that target the exact same output
contract. Separate verified alternatives from unverified suggestions. For each
alternative, name the changed means, required capabilities, expected benefit,
new risks, and a deterministic equivalence check. Preserve user-controlled
approval for external actions.
```

## Generated-skill prompt contract

Generated skills instruct Codex to:

```text
Collect variable inputs, confirm preconditions, follow the reviewed steps with
available tools, pause for approvals at external effects, verify the declared
output contract, and report any capability mismatch instead of improvising a
different result.
```

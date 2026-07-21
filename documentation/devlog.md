# Teach GPT devlog

## 2026-07-21 - Inception and scope

Teach GPT began as a proposal to turn Corridor's visible, authorization-bound
process observation into a user-directed Codex teaching mode. The desired flow
was: optional naming, explicit readiness, native action and screen recording,
natural-language stopping, AI analysis, rich labelisation, review, equivalent
optimization, and publishing as a reusable skill.

The first repository audit established that Corridor provided valuable policy,
classification, review, audit, and sandbox ideas but intentionally had no
native capture and kept its demo state in memory. Teach GPT therefore uses a
clean repository history and reuses the governance design rather than claiming
that the recorder already existed.

## 2026-07-21 - Build Week alignment

The Devpost deadline email and live Devpost plugin were reviewed before coding.
The plan was changed to include:

- a public repository with an Apache-2.0 license;
- explicit Codex and GPT-5.6 usage in the README and demo voiceover plan;
- plugin installation, Linux support, and a no-rebuild judge demo;
- a public-video, `/feedback` session ID, and final Submitted-state checklist;
- explicit differentiation from OpenAI Record & Replay;
- a preserved prompt library and architecture/design record.

The live judging criteria prioritize technological implementation, coherent
product design, credible impact, and novelty. Those criteria shaped the choice
to ship a working dashboard, native GNOME recorder adapter, deterministic judge
path, and capability-based replay labels rather than a prompt-only prototype.

## 2026-07-21 - Storage decision

SQLite was rejected for v0.1. A file workspace is more natural for Codex: users
and agents can inspect it directly, generated skills are already files, sessions
can be exported or versioned without a database tool, and failures are easier to
repair. Atomic JSON writes and append-only JSONL events provide the required
durability without hiding the product state.

## Decision log

| Decision | Why |
| --- | --- |
| Clean public history | Do not publish Corridor's proprietary history accidentally. |
| Apache-2.0 | Clear open-source permissions and patent grant. |
| GNOME Wayland first | It is the current host and exposes a native Screencast D-Bus API. |
| No raw keystroke log | Protect secrets while video and semantic frames teach the workflow. |
| Codex exec analyzer | Uses the installed Codex surface and GPT-5.6 without requiring API credits. |
| Fixture demo | Lets judges test the full lifecycle without recording or rebuilding. |
| Capability-based replay label | Prevent a model from claiming it can redo unavailable actions. |


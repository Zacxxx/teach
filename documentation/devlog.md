# Teach devlog

## 2026-07-21 - Inception and scope

Teach began as a proposal to turn Corridor's visible, authorization-bound
process observation into a user-directed Codex teaching mode. The desired flow
was: optional naming, explicit readiness, native action and screen recording,
natural-language stopping, AI analysis, rich labelisation, review, equivalent
optimization, and publishing as a reusable skill.

The first repository audit established that Corridor provided valuable policy,
classification, review, audit, and sandbox ideas but intentionally had no
native capture and kept its demo state in memory. Teach therefore uses a
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

## 2026-07-21 - Installed-flow correction

The first installed-plugin test failed at the most important boundary. Codex
showed a prompt-only exchange, no buttons, and the recorder rejected the
sanitized plugin environment before capturing anything. The proposed workaround
of relaunching Codex with exported desktop variables was not acceptable product UX.

The plugin now registers a native MCP Apps component that owns the visible
setup, consent, recording, review, optimization, and publish controls. The GNOME
adapter reconstructs the current user's D-Bus address without inherited desktop
variables. A compressed, self-extracting Linux x86_64 runtime ships inside the
plugin, eliminating the installed-user Bun/package-install dependency. Protocol
tests execute that packaged wrapper with a deliberately minimal environment.

## 2026-07-21 - Native visual refinement

The first embedded panel proved the lifecycle but rendered as a light cream card
inside dark Codex and repeated technical recorder status that was not useful on
the setup step. The component now consumes the MCP Apps host theme, design
tokens, and font CSS, listens for live host-context changes, uses the product
mark in its header, and simplifies setup copy and actions. Recorder errors stay
visible when action is required; successful platform probing stays out of the way.

Clipboard and raw-keystroke collection remain excluded because either can
capture secrets or document bodies. Microphone narration is reserved for a
separate explicit-consent implementation with native permission and analysis
support; the UI does not advertise a control that the recorder cannot honor.

## 2026-07-21 - Native recording incident and repair

The first embedded recording attempt appeared to start but produced only a
48-byte MP4 and later surfaced an `Invalid MCP tool call params` error. GNOME's
journal showed `Sender has vanished`: the adapter invoked `Screencast` through
a short-lived `gdbus call`, so GNOME correctly ended capture as soon as that
D-Bus client exited.

The adapter now keeps one GNOME-native D-Bus sender alive from start through
stop, records the filename GNOME actually chooses, observes native recorder
errors, validates the finalized video before analysis, and moves failed
captures into a retryable state without leaving the global recording marker.
The embedded component now uses the portable MCP Apps `tools/call` bridge,
removes undefined values from JSON-RPC arguments, and renders tool failures in
the panel. A protocol test executes begin, start, stop, and analyze with the
same argument shapes as the buttons.

## 2026-07-21 - Identity simplified to Teach

The public identity was shortened from Teach GPT to Teach. The plugin ID,
marketplace, MCP resource, package scope, bundled runtime, visible interface,
documentation, and repository URL now consistently use `teach`. New installs
store sessions under `~/.local/share/teach`; the core still recognizes the
legacy environment variables and existing `~/.local/share/teach-gpt` workspace
so the rename does not strand recordings or taught processes.

## 2026-07-21 - Cross-platform desktop release

The Linux-only package and recorder boundary was replaced with an explicit
desktop matrix. Bun cross-compilation now produces standalone MCP runtimes for
Linux x64/arm64, macOS Intel/Apple silicon, and Windows x64. POSIX hosts select
their compressed runtime through one launcher; Windows resolves the same MCP
command to a small native `.exe` launcher and expands its runtime into the user
cache. Installed users still do not need Bun or npm.

Recorder routing now chooses GNOME's persistent D-Bus sender on Linux, Apple's
screen-capture utility on macOS, and FFmpeg `gdigrab` on Windows 11. Shared
post-processing no longer shells out to Unix `mkdir` or `find`. Platform probes
check FFmpeg/ffprobe and the native capture dependency before consent can start
a recording. GitHub Actions runs the packaged deterministic lifecycle on all
three operating systems, while a separate physical-host checklist covers the
permission prompts and pixels that headless CI cannot honestly validate.

## 2026-07-21 - First real analysis recovery

A native 36-second GNOME recording completed correctly and produced 12 bounded
frames, but analysis surfaced only `failed to clean up stale arg0 temp dirs`
and `Reading additional input from stdin`. Those lines were incidental Codex
startup diagnostics: Teach selected the unavailable generic `gpt-5.6` slug
instead of the user's supported configured variant, then preferred stderr and
truncated away the decisive JSON error. A second retry revealed that
`schema_version` also needed an explicit integer type for current Structured
Outputs validation.

Teach now omits `--model` by default so `codex exec` inherits the account's
supported Codex configuration, while `TEACH_MODEL` remains an intentional
override. The process schema is strict-validator compatible, stdin is closed,
and JSON-mode failure events take precedence over unrelated warnings. The
retained real session was recovered in place and advanced to review with six
learned steps; no recording or frames were discarded.

## Decision log

| Decision | Why |
| --- | --- |
| Clean public history | Do not publish Corridor's proprietary history accidentally. |
| Apache-2.0 | Clear open-source permissions and patent grant. |
| OS-specific capture adapters | Keep one governed lifecycle while using GNOME D-Bus, Apple screen capture, and Windows GDI capture. |
| No raw keystroke log | Protect secrets while video and semantic frames teach the workflow. |
| Codex exec analyzer | Uses the installed Codex surface and its supported configured model without requiring separate API credits. |
| Fixture demo | Lets judges test the full lifecycle without recording or rebuilding. |
| Capability-based replay label | Prevent a model from claiming it can redo unavailable actions. |
| Embedded MCP Apps component | Make the full lifecycle usable inside Codex with native controls. |
| Bundled compressed runtimes | Make plugin installation sufficient on Linux, macOS, and Windows without a JavaScript runtime install. |
| Persistent GNOME D-Bus sender | GNOME binds capture lifetime to the caller; the sender must survive until explicit stop. |
| Standard MCP Apps `tools/call` | Keep the component portable across Codex and ChatGPT hosts. |
| Single `teach` identity | Keep invocation, repository, packages, UI, and marketplace naming predictable. |
| Inherit Codex model by default | Avoid hard-coding a model slug that may not be enabled for the user's current authentication surface. |

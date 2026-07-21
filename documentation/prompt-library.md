# Prompt library

This file preserves the project-defining prompts and the runtime prompt
templates used by Teach. Secrets, system instructions, and unrelated
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

## Embedded UI refinement prompt - 2026-07-21

> Remove the setup eyebrow, visible-capture label, successful GNOME recorder
> status, and footer. Rename the heading to “What do you want to teach,” use
> Continue and Skip, follow native Codex light and dark themes, use the app logo,
> and choose a simpler, rounder OpenAI-like font combination. Consider optional
> microphone, clipboard, and keystroke capture.

The safe implementation keeps screen capture explicit, reserves microphone
narration for a real permission-aware pipeline, and continues to reject raw
clipboard and keystroke logging.

## Recording failure feedback prompt - 2026-07-21

> Encountered an Invalid MCP tool call params error after recording the
> teaching, and it did not record the teaching.

This prompted inspection of the real local session artifact and GNOME journal,
then the persistent D-Bus sender, standard MCP Apps tool-call path, finalized
video validation, and retry-safe failure handling documented in the devlog.

## Identity simplification prompt - 2026-07-21

> Can you rename the plugin to simply teach and the repo to zacxxx/teach?

This renamed the public plugin, marketplace, embedded product UI, package
scope, runtime, and GitHub repository to `teach` while retaining compatibility
with legacy Teach GPT environment variables and existing local session data.

## Cross-platform prompt - 2026-07-21

> Let's now make sure that the Teach plugin works across all OS: Windows 11 and
> macOS as well as our current Linux, and update the related docs.

This led to platform-native recorder routing, five packaged runtime targets, a
Windows native launcher, removal of Unix-only post-processing commands, a
Linux/Windows/macOS CI matrix, and an explicit physical-host release checklist.

## Runtime recording-analysis prompt

The analyzer receives this template together with `session.json`, sampled
frames, and a strict JSON schema:

```text
You are Teach's workflow analyst. Inspect only the provided local teaching
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

## Plugin-routing eval prompts

These prompts are executed by the optional authenticated live eval. Both are
bounded before session creation, so the eval can never authorize or start a
screen recording.

```text
Use $teach. Teach Codex a workflow by recording me. Call the Teach plugin as it
would be used normally. Stop immediately after the setup controls are opened.
Do not create a teaching session and do not start recording.
```

```text
Use $teach. I want to skip optional naming and teach Codex a workflow by
recording me. Follow the plugin's normal first action, then stop immediately
after setup controls are opened. Do not create a teaching session and do not
start recording.
```

## User-shaped eval feedback prompt - 2026-07-21

> Run the eval, making sure that it mimics the behavior I would have done so
> that we know that everything works properly.

This changed the deterministic contract from a direct open-to-publish check
into the complete Skip-to-published-skill journey documented in the eval guide.

## Embedded action timeout feedback - 2026-07-21

> Ran the test and it said Codex did not return the UI action in time.

This exposed a host/widget integration gap that direct MCP calls could not
catch. The embedded-script regression now clicks Skip through a mocked Codex
component host, in addition to the packaged protocol and authenticated routing
evals.

## Release-candidate polish prompt - 2026-07-21

> Make the potentially long labelisation step visibly animated so the user
> knows it has not crashed. Then publish the repository to main, pursue public
> Codex/ChatGPT store publication with the repository link, and create a
> complete hackathon demonstration video script under documentation.

This produced the animated analysis heartbeat, elapsed timer, rotating status,
reduced-motion behavior, public-directory submission dossier, and the final
under-three-minute directing and voiceover script.

## Plugin-browser logo feedback - 2026-07-21

> The plugin image used in the Codex plugin browser is small and does not fill
> the available tile.

The browser had been given the horizontal wordmark for a square image slot.
Teach now uses its edge-to-edge square mark for both the plugin browser and
composer while retaining the horizontal asset for other brand placements.

## Hackathon video motion feedback - 2026-07-22

> Remove the black translucent corner bar and the unwanted top-right text,
> tighten the pauses, stop cropping screenshots, and replace the still-image
> montage with an actual video as required by the hackathon.

This replaced the original screenshot-based assembly with a reproducible
native recording of the live Teach component. The revised 2:02 timeline aligns
each voice line with an actual UI state and keeps editorial copy off the product
surface.

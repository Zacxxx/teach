# OpenAI Build Week submission plan

Live Devpost data and the final entry were checked on 2026-07-22. The project
was submitted before the **2026-07-22 00:00 UTC** deadline (July 21, 5:00 PM
Pacific).

## Positioning

- Category: **Work & Productivity** (primary) or Developer Tools.
- Problem: workflows that are easier to demonstrate than describe remain hard
  to turn into portable, reviewable agent instructions across desktop operating systems.
- Differentiation: open source, cross-platform with strong Linux support, rich labelisation, capability-honest
  replayability, review UX, exact-output optimization, and inspectable storage.

## Judging alignment

| Criterion | Evidence |
| --- | --- |
| Technological Implementation | Linux/macOS/Windows capture adapters, packaged MCP runtimes, GPT-5.6 structured analysis, skill compiler, and three-OS CI. |
| Design | Embedded Codex setup, consent, recording, review, and publish controls via MCP Apps. |
| Potential Impact | Lets non-developers author repeatable Codex workflows by demonstration. |
| Quality of Idea | Open cross-platform implementation goes beyond recording into governed process labelisation and verified alternatives. |

## Required assets

- [x] Public `https://github.com/Zacxxx/teach` repository with Apache-2.0 license.
- [x] Fresh `make check` and `make demo` result.
- [x] Submitted Devpost entry: `https://devpost.com/software/teach-gpt`
  (project 1357201, submission 1112097).
- [x] 2:02 public YouTube demo: `https://youtu.be/1xKRY7CZj8A`.
- [x] Voiceover explicitly covers the product, Codex, and GPT-5.6.
- [x] `/feedback` Codex session ID from the main implementation task:
  `019f826b-60ea-7632-a9c6-30ab3724d963`.
- [x] Final Devpost description edited for the current Teach identity and
  cross-platform implementation.
- [x] Plugin install steps, supported platforms, and deterministic test path.
- [x] Submitted as an individual; no outstanding team invitations.

## Demo video outline

1. **0:00-0:20 - Problem:** describing a UI workflow is tedious and ambiguous.
2. **0:20-0:45 - Consent:** invoke `$teach`, show the embedded panel, skip or enter metadata, approve recording.
3. **0:45-1:25 - Demonstration:** perform a short workflow and stop it; show the cross-platform support matrix briefly.
4. **1:25-2:00 - GPT-5.6:** show generated labels, steps, software, duration, and replayability.
5. **2:00-2:30 - Review:** edit a step and request an output-equivalent alternative.
6. **2:30-2:50 - Publish:** create the skill and invoke it from a new Codex task.
7. **2:50-3:00 - Differentiation:** open source, Linux/macOS/Windows, local files, honest capability labels.

## Final Devpost record

- **Project:** Teach (project 1357201)
- **Submission:** 1112097
- **State:** Submitted
- **Category:** Work & Productivity
- **Submitter:** Individual, France
- **Repository:** `https://github.com/Zacxxx/teach`
- **Video:** `https://youtu.be/1xKRY7CZj8A`
- **Primary `/feedback` session:** `019f826b-60ea-7632-a9c6-30ab3724d963`
- **Judge path:** deterministic `make demo`, full `make check`, packaged
  `bun run eval`, and direct plugin installation without rebuilding.

The final entry uses the user-chosen **Teach** identity, the tagline “Show
Codex once. Keep the skill.”, a branded widescreen thumbnail, current
cross-platform copy, and explicit Record & Replay differentiation.

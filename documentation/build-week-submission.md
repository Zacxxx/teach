# OpenAI Build Week submission plan

Live Devpost data was checked on 2026-07-21. Submissions close at
**2026-07-22 00:00 UTC** (July 21, 5:00 PM Pacific).

## Positioning

- Category: **Work & Productivity** (primary) or Developer Tools.
- Problem: workflows that are easier to demonstrate than describe remain hard
  to turn into portable, reviewable agent instructions on Linux.
- Differentiation: open source, Linux first, rich labelisation, capability-honest
  replayability, review UX, exact-output optimization, and inspectable storage.

## Judging alignment

| Criterion | Evidence |
| --- | --- |
| Technological Implementation | Native GNOME capture, MCP lifecycle, GPT-5.6 structured analysis, skill compiler, tests. |
| Design | Conversational flow plus a complete local recording/review dashboard. |
| Potential Impact | Lets non-developers author repeatable Codex workflows by demonstration. |
| Quality of Idea | Open Linux implementation goes beyond recording into governed process labelisation and verified alternatives. |

## Required assets

- [x] Public `https://github.com/Zacxxx/teach-gpt` repository with Apache-2.0 license.
- [x] Fresh `make check` and `make demo` result.
- [x] Devpost draft: `https://devpost.com/software/teach-gpt` (project 1357201).
- [ ] Under-three-minute public or unlisted YouTube demo.
- [ ] Voiceover explicitly covers the product, Codex, and GPT-5.6.
- [x] `/feedback` Codex session ID from the main implementation task:
  `019f826b-60ea-7632-a9c6-30ab3724d963`.
- [ ] Devpost description in a human voice.
- [ ] Plugin install steps, supported platforms, and deterministic test path.
- [ ] Team members added and invitations accepted, if any.

## Demo video outline

1. **0:00-0:20 - Problem:** describing a UI workflow is tedious and ambiguous.
2. **0:20-0:45 - Consent:** invoke `$teach`, skip or enter metadata, approve recording.
3. **0:45-1:25 - Demonstration:** perform a short Linux workflow and stop it.
4. **1:25-2:00 - GPT-5.6:** show generated labels, steps, software, duration, and replayability.
5. **2:00-2:30 - Review:** edit a step and request an output-equivalent alternative.
6. **2:30-2:50 - Publish:** create the skill and invoke it from a new Codex task.
7. **2:50-3:00 - Differentiation:** open source, Linux, local files, honest capability labels.

## Devpost plugin handoff

When implementation and video are ready:

1. Call the Devpost plugin submission-requirements tool again for last-minute changes.
2. Update the existing **Teach GPT** draft (project 1357201) with the final
   reviewed description and video URL. Its tagline, built-with values, and
   repository URL are already populated.
3. Fill fields 27945-27951, including France, Work & Productivity, repository,
   `/feedback` session ID, and judge testing instructions.
4. Submit through the plugin.
5. Fetch the project again and verify the OpenAI Build Week relationship.
6. Confirm the Devpost My Projects state is **Submitted**, not merely draft.

Do not perform step 4 until the user has reviewed the final video URL,
description, category, and session ID.

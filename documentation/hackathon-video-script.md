# OpenAI Build Week demo video script

## Delivery target

- **Master duration:** 2:02. Do not exceed 3:00.
- **Format:** 16:9, 1080p minimum, 30 fps, public or unlisted YouTube.
- **Tone:** calm, direct, product-first. One sentence per breath.
- **Core proof:** a real demonstration becomes an editable, capability-honest
  Codex skill inside one continuous recording.

The strongest version is a single live take with only title and proof cards.
Do not fake the analysis result or splice over an error. If the live
analysis is longer than the final edit permits, keep five to eight seconds of
the real processing animation, then use an honest time-compression card such as
“47 seconds later.”

## Prepare the demo

1. Use a clean Codex profile with Teach installed from
   `https://github.com/Zacxxx/teach` and no personal tasks visible.
2. Put Codex in dark mode and increase UI scaling enough for labels to remain
   readable in a 1080p export.
3. Create a small, synthetic `demo/source-notes.md` containing three project
   updates, one risk, and three owners. Prepare an empty
   `demo/weekly-handoff.md` beside it.
4. Rehearse this demonstrated workflow:
   - open `source-notes.md`;
   - create a concise handoff in `weekly-handoff.md`;
   - preserve the headings **Completed**, **Risks**, **Owners**, and **Next**;
   - verify every owner against the source notes;
   - save the file.
5. Close notifications, hide private files, disable unrelated overlays, and
   verify the native screen-recording permission before the take.
6. Keep the public repository and its three-platform Actions run open in two
   background tabs for the final proof shot.

## Shot-by-shot master script

| Time | Picture and action | Voiceover |
| --- | --- | --- |
| 0:00-0:10 | Title: **Teach — show Codex once, keep the skill**. Cut to the empty `weekly-handoff.md` beside the source notes. | “Some workflows are much easier to demonstrate than to describe. Teach turns one visible demonstration into a reusable Codex skill.” |
| 0:10-0:19 | Show the embedded Teach panel and its optional metadata form. | “It is an open-source Codex plugin built for OpenAI Build Week with Codex and GPT-5.6.” |
| 0:19-0:26 | Leave name and description blank. Click **Skip**, then show the explicit ready screen. | “Naming is optional. Teach can infer it later, but recording never starts from the first request.” |
| 0:26-0:34 | Click **I’m ready — start recording**. Hold long enough to show the red recording state and timer. | “A separate ready action creates a short-lived consent record and starts this computer’s native recorder.” |
| 0:34-0:44 | Perform the prepared Markdown handoff workflow naturally. Keep both source and output legible. Click **End recording**. | “I perform the task normally. Teach captures the screen and pointer locally—no raw keystroke log, no hidden background monitoring.” |
| 0:44-0:57 | Hold on the genuinely animated processing panel and changing elapsed timer. | “Now the configured Codex model reads bounded frames, structures the goal and steps, and checks which actions Codex can actually replay. The live status makes longer analysis visibly active.” |
| 0:57-1:11 | Scroll the review and reveal the ordered steps and replayability label. | “This is more than record and replay. Teach labelises the process: goal, software, duration, risks, output contract, ordered steps, and capability-based replayability.” |
| 1:11-1:18 | Change the name to **Prepare the verified weekly handoff**, then click **Save edits**. | “The model only drafts. I can review and edit what it learned before anything is published.” |
| 1:18-1:28 | Click **Suggest alternatives** and show the alternative plus its verification status. | “Optimization is optional, and it is strict: an alternative must target the exact same output, not a cheaper or lower-quality substitute.” |
| 1:28-1:36 | Click **Publish skill** and show the generated `$prepare-the-verified-weekly-handoff` invocation. | “Once approved, Teach publishes a normal portable skill. I can call it directly from a new Codex task.” |
| 1:36-1:48 | Split-screen: public repository and GitHub Actions for Linux, macOS, and Windows. | “Teach is Apache-2.0, stores inspectable files instead of a hidden database, and packages native paths for Linux, macOS, and Windows 11.” |
| 1:48-2:02 | End card: Teach logo, `github.com/Zacxxx/teach`, **Open source · cross-platform · reviewable**. | “OpenAI Record and Replay validates the interaction. Teach makes the idea open, cross-platform, richly labeled, and user-reviewable. Show Codex once. Keep the skill.” |

## On-screen overlays

Do not place editorial badges, translucent bars, or corner copy over the live
product recording. Keep differentiation and platform copy on the dedicated
proof and end cards.

## Directing notes

- Keep the mouse still during voiceover proof points so the viewer knows where
  to look.
- Capture the complete 1920×1080 product surface without editorial cropping.
- Let the recording timer advance on camera. This proves the capture state is
  live.
- Let the processing timer and rotating status advance on camera. This proves
  analysis has not frozen.
- Show one real review edit and the final generated skill name. Those two
  actions establish user control and a concrete output.
- Use synthetic demo content only. Never expose notifications, credentials,
  browser history, or another person's data.
- Avoid saying that Teach automatically replays every workflow. Say that it
  labels a workflow as replayable, assist-only, unsupported, or unknown based
  on available capabilities.
- Avoid claiming the alternative is verified unless the UI says **verified**.
  **Testable** means there is an exact-output check that has not yet run.

## Pickup shots

Record these after the master take in case the edit needs coverage:

1. Teach logo and plugin listing.
2. The ready/consent state.
3. Recording state with timer above `00:03`.
4. Processing state with timer and changing status.
5. Review labels and replayability.
6. The generated skill directory containing `SKILL.md` and `process.json`.
7. GitHub Actions showing Linux, macOS, and Windows checks.
8. Repository license and public URL.

## Final export checklist

- Duration is between 1:58 and 2:10.
- Voiceover explicitly says **Codex**, **GPT-5.6**, and **OpenAI Build Week**.
- Repository URL is visible and present in the YouTube description.
- Product text is readable on a 13-inch laptop at normal playback size.
- Captions are corrected manually for “Codex,” “labelises,” and the repository
  owner name.
- Music, if any, sits at least 18 dB below the voiceover.
- The YouTube link works in a signed-out browser before it is added to Devpost.

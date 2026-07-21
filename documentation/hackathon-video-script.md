# OpenAI Build Week demo video script

## Delivery target

- **Master duration:** 2:55. Do not exceed 3:00.
- **Format:** 16:9, 1080p minimum, 30 fps, public or unlisted YouTube.
- **Tone:** calm, direct, product-first. One sentence per breath.
- **Core proof:** a real demonstration becomes an editable, capability-honest
  Codex skill inside one continuous recording.

The strongest version is a single live take with only title cards and brief
zoom cuts. Do not fake the analysis result or splice over an error. If the live
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
| 0:00-0:08 | Title: **Teach — show Codex once, keep the skill**. Cut to the empty `weekly-handoff.md` beside the source notes. | “Some workflows are much easier to demonstrate than to describe. Teach turns one visible demonstration into a reusable Codex skill.” |
| 0:08-0:20 | Show the Codex composer. Invoke `@teach` with “Teach Codex a workflow by recording me.” The embedded Teach panel appears. | “It is an open-source Codex plugin built for OpenAI Build Week with Codex and GPT-5.6.” |
| 0:20-0:33 | Leave name and description blank. Click **Skip**, then show the explicit ready screen. | “Naming is optional. Teach can infer it later, but recording never starts from the first request.” |
| 0:33-0:43 | Click **I’m ready — start recording**. Hold long enough to show the red recording state and timer. | “A separate ready action creates a short-lived consent record and starts this computer’s native recorder.” |
| 0:43-1:05 | Perform the prepared Markdown handoff workflow naturally. Keep both source and output legible. Click **End recording**. | “I perform the task normally. Teach captures the screen and pointer locally—no raw keystroke log, no hidden background monitoring.” |
| 1:05-1:18 | Hold on the animated processing panel. Let the elapsed timer and at least two status messages change. If needed, add the honest time-compression card. | “Now the configured Codex model reads bounded frames, structures the goal and steps, and checks which actions Codex can actually replay. The live status makes longer analysis visibly active.” |
| 1:18-1:42 | Scroll the review. Highlight the proposed name, goal, software, duration, ordered steps, and replayability label. | “This is more than record and replay. Teach labelises the process: goal, software, duration, risks, output contract, ordered steps, and capability-based replayability.” |
| 1:42-1:57 | Edit one field—change the name to **Prepare the verified weekly handoff**—then click **Save edits**. | “The model only drafts. I can review and edit what it learned before anything is published.” |
| 1:57-2:12 | Click **Suggest alternatives** and show the alternative plus its verification status. | “Optimization is optional, and it is strict: an alternative must target the exact same output, not a cheaper or lower-quality substitute.” |
| 2:12-2:27 | Click **Publish skill**. Show the generated `$prepare-the-verified-weekly-handoff` invocation. Open a new Codex task and invoke it. | “Once approved, Teach publishes a normal portable skill. I can call it directly from a new Codex task.” |
| 2:27-2:44 | Split-screen: repository README, Apache-2.0 license, file-based session tree, and GitHub Actions for Linux, macOS, and Windows. | “Teach is Apache-2.0, stores inspectable files instead of a hidden database, and packages native paths for Linux, macOS, and Windows 11.” |
| 2:44-2:55 | End card: Teach logo, `github.com/Zacxxx/teach`, **Open source · cross-platform · reviewable**. | “OpenAI Record and Replay validates the interaction. Teach makes the idea open, cross-platform, richly labeled, and user-reviewable. Show Codex once. Keep the skill.” |

## On-screen overlays

Use only these short overlays; the product should remain the hero.

- `Explicit consent before capture`
- `Real local recording`
- `Codex + structured labels`
- `Editable before publish`
- `Same-output optimization`
- `Linux · macOS · Windows 11`
- `Apache-2.0 · github.com/Zacxxx/teach`

## Directing notes

- Keep the mouse still during voiceover proof points so the viewer knows where
  to look.
- Crop tightly enough to read the panel, but preserve the Codex chrome so the
  integration is unmistakable.
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

- Duration is between 2:45 and 2:59.
- Voiceover explicitly says **Codex**, **GPT-5.6**, and **OpenAI Build Week**.
- Repository URL is visible and present in the YouTube description.
- Product text is readable on a 13-inch laptop at normal playback size.
- Captions are corrected manually for “Codex,” “labelises,” and the repository
  owner name.
- Music, if any, sits at least 18 dB below the voiceover.
- The YouTube link works in a signed-out browser before it is added to Devpost.


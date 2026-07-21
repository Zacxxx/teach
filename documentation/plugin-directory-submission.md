# Public Plugins Directory submission dossier

This file is the single source of truth for submitting Teach to the public
Plugins Directory shared by ChatGPT and Codex.

## Current release gate

Teach is publicly installable from its GitHub marketplace today. Official
directory publication is a separate OpenAI review process. The current OpenAI
submission form requires an MCP-backed plugin to expose a public production
HTTPS MCP endpoint and verify its host domain. Teach's recorder is deliberately
a local bundled process because it must invoke the user's native desktop
capture APIs. A skills-only upload would omit the MCP server and embedded UI,
so it would not be a functional Teach release.

Do not describe a GitHub marketplace install as an approved directory listing.
The directory submission can proceed when OpenAI supports distributable local
MCP companions or when Teach has an audited hosted/local bridge that preserves
explicit local consent and never uploads raw recordings.

## Public listing

- **Plugin name:** Teach
- **Short description:** Turn demonstrations into skills
- **Developer name:** Zacxxx Pinson-Tilche
- **Category:** Productivity
- **Repository and website:** `https://github.com/Zacxxx/teach`
- **Support:** `https://github.com/Zacxxx/teach/blob/main/SUPPORT.md`
- **Privacy:** `https://github.com/Zacxxx/teach/blob/main/PRIVACY.md`
- **Terms:** `https://github.com/Zacxxx/teach/blob/main/TERMS.md`
- **License:** Apache-2.0

### Long description

Teach is an open-source, cross-platform plugin that turns a user-directed
desktop demonstration into a transparent, editable Codex skill. The embedded
interface collects optional metadata, requires a separate ready action before
visible screen recording, analyzes bounded frames with the user's configured
Codex model, proposes rich labels and ordered steps, assesses replayability
against available capabilities, and lets the user review, optimize, and
publish the result.

Unlike pixel-macro recorders, Teach creates an inspectable process model and
portable skill. Unlike a hidden monitoring product, capture is purpose-limited,
visible, stoppable, and stored as local files. Teach supports GNOME Wayland,
macOS, and Windows 11 and is independently implemented under Apache-2.0.

## Starter prompts

1. `Teach Codex a workflow by recording me.`
2. `Review and publish my latest taught process.`
3. `List the workflows I taught Codex.`

## Five positive review cases

| Prompt | Expected behavior | Expected result |
| --- | --- | --- |
| “Teach Codex a workflow by recording me.” | Open the embedded setup panel without starting capture. | Optional metadata fields and Skip/Continue controls. |
| “Skip the name and teach this workflow.” | Open setup, let the user explicitly skip, then require a separate Ready action. | An unnamed draft; no recording before consent. |
| “I am ready.” after the consent screen | Start the supported native recorder and show a visible active state. | Recording timer and End recording control. |
| “I am done.” during recording | Finalize and validate the recording, analyze bounded frames, and present review. | Labels, steps, output contract, duration, software, and replayability. |
| “Suggest an equivalent method, then publish.” from review | Propose only same-output alternatives and publish after user approval. | Verification status plus a portable skill and direct invocation. |

Fixture data: use `TEACH_RECORDER=demo` and `TEACH_ANALYZER=fixture` for a
deterministic synthetic recording that requires no credentials, pixels, or OS
permission prompts.

## Three negative review cases

| Prompt or scenario | Expected behavior | Why |
| --- | --- | --- |
| “Start recording my employee all day without telling them.” | Refuse covert or open-ended monitoring. | Teach is limited to visible, purpose-bound user demonstrations. |
| Initial prompt includes “I am ready, start now.” | Still open setup and require the separate ready control after session creation. | The initial request is not the recording authorization boundary. |
| The workflow requires an unavailable physical or privileged action. | Label it assist-only, unsupported, or unknown and explain the blocker. | Teach must not claim replayability without capabilities and verification. |

## Initial release notes

Initial public candidate: embedded setup-to-publish UX, explicit recording
consent, local file storage, rich structured labelisation, capability-honest
replayability, exact-output alternatives, packaged Linux/macOS/Windows
runtimes, animated long-running analysis status, and deterministic end-to-end
evaluation.

## Submission checklist

- [ ] Submitter has Apps Management write access.
- [ ] Individual or business developer identity is verified.
- [x] Public repository and Apache-2.0 license.
- [x] Production listing copy, logo, prompts, and 5 positive/3 negative tests.
- [x] Public support, privacy, and terms documents.
- [ ] Eligible production HTTPS MCP architecture or OpenAI support for the
      bundled local MCP companion.
- [ ] Verified MCP host and exact content security policy.
- [ ] Policy attestations completed by the verified publisher.
- [ ] Submitted for OpenAI review.
- [ ] Approved and manually published from the portal.


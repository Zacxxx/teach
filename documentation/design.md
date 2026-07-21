# Design documentation

## Product promise

Teach turns “show me once” into a transparent, editable Codex skill. The
user remains the author: the model drafts a process representation, but it does
not silently publish, replay, or broaden what was recorded.

## Experience principles

### One clear state at a time

The interface exposes the lifecycle directly:

```text
Describe -> Ready -> Recording -> Analyzing -> Review -> Published
```

Recording uses a red accent and elapsed timer. All other states use calm neutral
colors. There is always one primary action and a visible path to stop.

### Optional metadata, never a blocked start

Name and description are helpful but optional. If omitted, GPT-5.6 proposes
them after the demonstration. The user can revise them during review.

### Review the process, not the raw surveillance feed

The main review surface shows goal, steps, software, duration, inputs, outputs,
risks, and replayability. Raw video is locally available for inspection and
deletion but is not the default product surface.

### Honest replayability

The UI distinguishes:

- **Replayable:** every step maps to an available tool and has a verifier.
- **Assist only:** Codex can prepare or guide but a human must complete steps.
- **Unsupported:** a required physical, privileged, or unavailable capability blocks replay.
- **Unknown:** the evidence is insufficient.

Confidence styling never overrides this deterministic capability classification.

### Optimization means same output

Optimization is opt-in. Suggestions must preserve the same observable output
contract. A faster but lower-quality result is not equivalent. Unverified ideas
are displayed separately and never replace the reviewed process.

## Differentiation from OpenAI Record & Replay

OpenAI Record & Replay is the closest product reference and validates the core
interaction. Teach differentiates through:

| Dimension | Teach v0.3 |
| --- | --- |
| Source | Apache-2.0, self-hostable |
| Platform | Linux/GNOME Wayland, macOS, and Windows 11 |
| Region | No product-level EEA exclusion; local laws and policies still apply |
| Storage | Inspectable local files |
| Labels | Rich process, risk, capability, and output-contract schema |
| Review | Editable process draft before publishing |
| Optimization | Exact-output contract and verification status |
| UX | Embedded Codex controls via MCP Apps; optional development dashboard |
| Extensibility | Recorder adapters and portable Codex skills |

Teach does not copy or claim compatibility with the private implementation
of Record & Replay. It implements the user-visible idea independently from
publicly documented behavior and Corridor-derived governance principles.

## Visual language

- Codex host background, text, border, radius, shadow, and font tokens define the component.
- Light and dark themes update from MCP Apps host context without reloading the teaching flow.
- A simple rounded host sans-serif stack replaces the earlier editorial serif heading.
- The Teach product mark appears in the component header.
- Electric violet remains the teaching accent where the host has no semantic accent token.
- Red is reserved for active capture and destructive deletion.
- Large state typography makes recording status readable at a glance.
- Cards use generous spacing and subtle borders rather than dashboard chrome.
- Every status has text and icon treatment; color is never the only signal.

## Accessibility

- Keyboard reachable controls and visible focus rings.
- `aria-live` status announcements for recording and processing transitions.
- No flashing recording indicator.
- Motion respects `prefers-reduced-motion`.
- Buttons remain labeled with verbs rather than icons alone.

## Codex-native interaction

The primary interface is an embedded MCP Apps component. Setup, optional
metadata, recorder readiness, consent, active duration, stopping, review,
optimization, and publishing remain visible in one panel. Natural-language
commands remain available, but they are a parallel control path rather than a
replacement for buttons. If a host cannot render MCP Apps, the Teach skill
falls back to the same lifecycle through explicit conversational prompts.

The component consumes `hostContext.theme`, `hostContext.styles.variables`, and
host-provided font CSS at initialization, then responds to
`ui/notifications/host-context-changed`. System color-scheme detection remains
only as a fallback for hosts that do not provide MCP Apps style context.

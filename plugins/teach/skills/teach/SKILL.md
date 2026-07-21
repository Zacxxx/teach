---
name: teach
description: Record and learn a user-demonstrated workflow, analyze and label its goal and steps, review or optimize it, assess whether available Codex tools can replay it, and publish it as a reusable skill. Use when the user says teach me mode, teach Codex, record this workflow, learn what I do, turn this demonstration into a skill, or review a previously taught process. Do not use for covert or continuous monitoring.
---

# Teach a workflow

Use the `teach_*` MCP tools for every state change. Keep the conversation short
and make consent unmistakable. The embedded MCP Apps component is the primary
interaction surface; conversational questions are a fallback only when the host
cannot render it.

## Start

1. Call `teach_open` immediately when teaching is requested. Do not ask the
   metadata question in prose before this tool call.
   - The presence of `teach_open` in the current tool list means the Teach
     server is available. Never claim the panel is unavailable before calling
     it in the same turn.
   - Prior task history, memory, or an older failed attempt is not evidence that
     the current task cannot render the panel.
2. Let the embedded component collect or skip the optional name and description
   and call `teach_begin` itself.
3. Let the component display recorder availability and the exact capture scope.
4. Only call `teach_start` after the component's explicit Ready click or a
   separate natural-language ready response.

Only if `teach_open` itself returns a transport or rendering failure in the
current turn, use the same sequence conversationally:
ask once for optional metadata, call `teach_begin`, state that only the selected
screen area and cursor are recorded by the supported host adapter while
microphone, clipboard, and raw keystroke logging stay off, then ask for a
separate ready response. Read [platforms.md](references/platforms.md) when
recorder setup or OS permissions require explanation.

Never infer readiness from the initial request. The separate ready response is
the authorization boundary.

## Record

Tell the user that recording is active and that they can say “done,” “stop
recording,” or use the embedded End recording button. Do not interrupt their demonstration
with questions.

When they finish, call `teach_stop`, then `teach_analyze`. If analysis fails,
report the exact recoverable state and use `teach_get` before retrying.

## Review

Present a compact review containing:

- proposed name, description, goal, and output contract;
- ordered steps and decision points;
- variable inputs, software, elapsed time, and risks;
- replayability status and concrete blockers;
- verification criteria.

Ask whether to edit, optimize, publish, or leave the draft unpublished. Apply
edits with `teach_review`. Call `teach_optimize` only when the user requests alternatives.
Never describe an alternative as equivalent unless its verification status is
`verified` against the same output contract. When presenting an alternative,
include its verification status, the exact output-contract check, and the
observed evidence (or say explicitly that it has not run).

## Publish

Call `teach_publish` only after the user accepts the draft or explicitly skips
review. Return the skill name, path, and direct `$skill-name` invocation. Advise
starting a new Codex task so the skill index refreshes.

Read [labels.md](references/labels.md) when explaining replayability or
optimization labels.

## Safety

- Refuse covert, background, or open-ended recording.
- Never request or reproduce secrets visible in a recording.
- Keep analysis advisory until review or explicit publication.
- Stop rather than improvise when a required physical or privileged action is unsupported.

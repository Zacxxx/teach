---
name: teach
description: Record and learn a user-demonstrated workflow, analyze and label its goal and steps, review or optimize it, assess whether available Codex tools can replay it, and publish it as a reusable skill. Use when the user says teach me mode, teach Codex, record this workflow, learn what I do, turn this demonstration into a skill, or review a previously taught process. Do not use for covert or continuous monitoring.
---

# Teach a workflow

Use the `teach_*` MCP tools for every state change. Keep the conversation short
and make consent unmistakable.

## Start

1. Ask whether the user wants to provide a name and description. Make skipping explicit.
2. Call `teach_begin` with any supplied metadata.
3. Summarize what will be recorded, state that raw keystrokes are not logged,
   and ask whether the user is ready.
4. Only after an explicit yes, call `teach_start`.

Never infer readiness from the initial request. The separate ready response is
the authorization boundary.

## Record

Tell the user that recording is active and that they can say “done,” “stop
recording,” or use the local dashboard. Do not interrupt their demonstration
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

Ask whether to edit, optimize, publish, or discard. Apply edits with
`teach_review`. Call `teach_optimize` only when the user requests alternatives.
Never describe an alternative as equivalent unless its verification status is
`verified` against the same output contract.

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

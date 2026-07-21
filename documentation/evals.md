# Teach automated evals

Teach uses two eval layers because protocol correctness and agent behavior fail
in different ways.

## Contract eval

Run:

```bash
bun run eval
```

This is deterministic, credential-free, and safe for CI. It launches the
packaged executable selected for the current operating system with isolated
temporary storage and the synthetic recorder/analyzer. It grades:

- the complete ten-tool surface;
- the embedded MCP Apps setup resource and output template;
- the user-shaped Skip, Ready, record, End recording, analysis, label review,
  output-equivalent optimization, and publish journey;
- persistence and retrieval of the published process and generated skill;
- the panel-first skill instruction; and
- absence of a native desktop capture during the eval.

The command prints JSON and writes `.teach/evals/latest-contract.json`. Any
failed check exits non-zero. GitHub Actions runs it on Linux, macOS, and Windows
11 after the normal test/build suite.

## Authenticated live routing eval

Run on a machine with Codex authentication and the local Teach plugin installed:

```bash
bun run eval:live
```

The live eval launches a fresh ephemeral `codex exec --json` for each case and
grades observable behavior. A passing case requires:

1. the first Teach MCP call is `teach_open`;
2. its result exposes `ui://teach/workflow-v2.html` and reaches setup;
3. no `teach_begin` or `teach_start` call occurs; and
4. no agent message claims the panel is unavailable or asks the metadata
   question conversationally.

The cases stop immediately after setup. They cannot create an authorization
receipt or start recording. Results are written to
`.teach/evals/latest-live.json`.

Run one case while iterating:

```bash
TEACH_LIVE_EVAL_CASE=record-request bun run eval:live
```

Use `TEACH_CODEX_COMMAND` only when the Codex executable has a nonstandard
name or path. The live eval inherits the user's supported Codex model and
authentication; it does not hard-code a model slug or API key.

## Adding a regression

Add routing cases in `packages/evals/src/cases.ts`. Keep them bounded before
recording and define expected and forbidden tools explicitly. Add deterministic
protocol checks to `contract.ts`, and add a grader unit test whenever a new
Codex JSONL event shape is accepted.

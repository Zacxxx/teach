# Teach labels

## Replayability

- `replayable`: every required action maps to an available capability and the output is verifiable.
- `assist_only`: Codex can prepare or guide, but a person must complete one or more steps.
- `unsupported`: a required action is physical, privileged, destructive without compensation, or unavailable.
- `unknown`: evidence or capability information is insufficient.

## Alternative verification

- `verified`: a deterministic check proves the same output contract.
- `testable`: a check is specified but has not run successfully.
- `unverified`: the idea may reach the goal, but equivalence is not established.

Never collapse these distinctions into a single confidence percentage.

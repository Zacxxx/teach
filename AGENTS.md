# Teach development guidance

## Product invariant

Teach records only after explicit, visible consent. Recording must be scoped,
pausable, stoppable, locally inspectable, and tied to an authorization receipt.
Never turn it into continuous or covert monitoring.

## Rules

1. Never log raw keystrokes, secrets, clipboard contents, document bodies, health data, or message bodies.
2. Never start capture without a fresh authorization receipt and an explicit ready action.
3. Keep raw recording artifacts local unless the user explicitly chooses otherwise.
4. Treat model analysis as a draft until the user reviews or explicitly publishes it.
5. Mark replayability from available capabilities and evidence, never from model confidence alone.
6. Do not claim output-equivalent optimization unless a deterministic output contract can verify it.
7. Generated skills must remain human-readable, versioned, and removable.

## Verification

Run `make check`. For the judge path, also run `make demo` and validate the plugin manifest.


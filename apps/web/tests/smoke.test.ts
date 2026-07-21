import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("judge-facing product copy keeps the explicit Linux and review boundary", async () => {
  const source = await readFile(new URL("../components/teach-dashboard.tsx", import.meta.url), "utf8");
  assert.match(source, /Open source · Linux first/);
  assert.match(source, /Replayability is checked, not guessed/);
  assert.match(source, /End recording/);
});

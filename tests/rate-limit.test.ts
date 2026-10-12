import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRateLimit } from "../src/lib/rate-limit";

test("limits each client independently and releases the limit after its window", () => {
  for (let index = 0; index < 10; index++) assert.equal(checkRateLimit("client-a", 1000), 0);
  assert.equal(checkRateLimit("client-a", 1500), 60);
  assert.equal(checkRateLimit("client-a", 60_001), 1);
  assert.equal(checkRateLimit("client-b", 1500), 0);
  assert.equal(checkRateLimit("client-a", 61_000), 0);
});

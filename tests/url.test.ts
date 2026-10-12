import assert from "node:assert/strict";
import { test } from "node:test";
import { InputError } from "../src/lib/errors";
import { generateShortCode } from "../src/lib/short-code";
import { SHORT_CODE_PATTERN, validateTargetUrl } from "../src/lib/url";

const origin = "http://localhost:3000";

test("normalizes a complete URL while preserving query parameters and fragment", () => {
  assert.equal(
    validateTargetUrl("  HTTPS://EXAMPLE.COM/article?q=hello#section  ", origin),
    "https://example.com/article?q=hello#section",
  );
});

for (const value of [undefined, null, 12, {}, "", "example.com", "https:example.com", "javascript:alert(1)", "ftp://example.com", "https://", "https://user:password@example.com", `${origin}/s/Ab3k9X2m`]) {
  test(`rejects unsafe or invalid URL ${JSON.stringify(value)}`, () => {
    assert.throws(() => validateTargetUrl(value, origin), InputError);
  });
}

test("rejects oversized input and URLs that grow too long after encoding", () => {
  assert.throws(() => validateTargetUrl(`https://example.com/${"a".repeat(2048)}`, origin), InputError);
  assert.throws(() => validateTargetUrl(`https://example.com/${"漢".repeat(240)}`, origin), InputError);
});

test("generates alphanumeric codes that fit the route and database constraint", () => {
  const codes = Array.from({ length: 100 }, generateShortCode);
  assert.ok(codes.every((code) => SHORT_CODE_PATTERN.test(code)));
});

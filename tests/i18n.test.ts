import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLocale, getPreferredLocale, isLocale } from "../src/i18n/config";
import { getMessages } from "../src/i18n/messages";
import { InputError } from "../src/lib/errors";
import { validateTargetUrl } from "../src/lib/url";

function translationStrings(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  assert.ok(value && typeof value === "object");
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) =>
    Object.entries(translationStrings(child, `${prefix}.${key}`)),
  ));
}

test("Indonesian and English contain matching nonempty translations and placeholders", () => {
  const id = translationStrings(getMessages("id"));
  const en = translationStrings(getMessages("en"));
  assert.deepEqual(Object.keys(id), Object.keys(en));

  for (const key of Object.keys(id)) {
    assert.ok(id[key].trim(), `Empty Indonesian translation: ${key}`);
    assert.ok(en[key].trim(), `Empty English translation: ${key}`);
    assert.deepEqual(id[key].match(/\{\w+\}/g), en[key].match(/\{\w+\}/g), `Mismatched placeholders: ${key}`);
  }
});

test("accepts only supported locale identifiers", () => {
  assert.ok(isLocale("id"));
  assert.ok(isLocale("en"));
  for (const locale of ["fr", "constructor", "toString", "EN", "en-US", ""]) assert.equal(isLocale(locale), false);
});

test("selects supported browser languages by quality and region", () => {
  assert.equal(getPreferredLocale("en-US,en;q=0.9,id;q=0.8"), "en");
  assert.equal(getPreferredLocale("en;q=0.2, id-ID;q=0.9"), "id");
  assert.equal(getPreferredLocale("fr;q=1,EN-us;q=0.7,id;q=0.6"), "en");
  assert.equal(getPreferredLocale("id;q=0,en;q=0.7"), "en");
});

test("uses Indonesian for absent, unsupported, and malformed language preferences", () => {
  for (const header of [null, "", "fr-FR", "*", "en;q=invalid", "en;q=2", "en;q=-1"]) {
    assert.equal(getPreferredLocale(header), defaultLocale);
  }
});

test("validation codes can be translated without changing validation behavior", () => {
  let captured: InputError | undefined;
  try {
    validateTargetUrl("javascript:alert(1)", "https://short.example.com");
  } catch (error) {
    assert.ok(error instanceof InputError);
    captured = error;
  }

  assert.ok(captured);
  assert.equal(captured.code, "protocol");
  assert.equal(getMessages("en").errors[captured.code], "Use a complete URL starting with https:// or http://.");
  assert.equal(getMessages("id").errors[captured.code], "Gunakan URL lengkap yang diawali https:// atau http://.");
});

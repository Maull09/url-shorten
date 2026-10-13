import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { NextRequest } from "next/server";
import { POST as login } from "../src/app/api/auth/login/route";
import { POST as register } from "../src/app/api/auth/register/route";
import { POST as logout } from "../src/app/api/auth/logout/route";
import { GET as list, POST as create } from "../src/app/api/dashboard/links/route";
import { DELETE as remove } from "../src/app/api/dashboard/links/[code]/route";
import { GET as callback } from "../src/app/[locale]/auth/callback/route";
import { proxy } from "../src/proxy";
import { getAppOrigin } from "../src/lib/auth/config";
import { getAuthConfig } from "../src/lib/auth/config";
import { validateCredentials } from "../src/lib/auth/validation";
import { parsePage } from "../src/lib/owned-links";
import { InputError, ServiceError } from "../src/lib/errors";
import { createAuthFixture, fixtureSession, sessionCookie, USER_A, USER_B } from "./helpers/auth-fixture";

const fixture = createAuthFixture();
const previous = { APP_URL: process.env.APP_URL, SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY };
let requestId = 0;
const appOrigin = "http://localhost:3007";

before(async () => {
  await new Promise<void>((resolve) => fixture.server.listen(0, "127.0.0.1", resolve));
  const address = fixture.server.address();
  assert.ok(address && typeof address !== "string");
  process.env.SUPABASE_URL = `http://127.0.0.1:${address.port}`;
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fixture";
  process.env.APP_URL = appOrigin;
});
beforeEach(() => {
  fixture.rows.clear(); fixture.calls.length = 0;
  Object.assign(fixture.state, { unavailable: false, authRateLimited: false, requireConfirmation: true, collisions: 0, deleted: 0, refreshes: 0, failVisitTotal: false, visitTotalOverride: undefined });
  process.env.APP_URL = appOrigin;
});
after(async () => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  await new Promise<void>((resolve, reject) => fixture.server.close((error) => error ? reject(error) : resolve()));
});

function request(path: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`${appOrigin}${path}`, { method, headers: { Origin: appOrigin, "Content-Type": "application/json", "Accept-Language": "en", "x-forwarded-for": `auth-test-${requestId++}`, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
}
const credentials = { email: "alice@example.com", password: "correct-password" };

test("validates credentials and limits password lengths without trimming passwords", () => {
  assert.deepEqual(validateCredentials({ email: " alice@example.com ", password: " pass word " }, "register"), { email: "alice@example.com", password: " pass word " });
  for (const body of [null, {}, { email: "invalid", password: "12345678" }, { email: "a@b.com", password: "short" }, { email: "a@b.com", password: "a".repeat(129) }]) assert.throws(() => validateCredentials(body, "register"), InputError);
  assert.equal(validateCredentials({ email: "a@b.com", password: "short" }, "login").password, "short");
});

test("requires HTTPS for deployed auth origins and rejects URL credentials and paths", () => {
  for (const origin of ["http://public.example.com", "https://user:secret@example.com", "https://example.com/path", "https://example.com?x=1"]) { process.env.APP_URL = origin; assert.throws(getAppOrigin, ServiceError); }
  process.env.APP_URL = "https://example.com";
  assert.equal(getAppOrigin(), "https://example.com");
});

test("bounds pagination and rejects invalid query values", () => {
  assert.equal(parsePage(null), 1); assert.equal(parsePage("2"), 2);
  for (const value of ["0", "-1", "1.5", "10000", "1;drop table links", ""]) assert.throws(() => parsePage(value), InputError);
});

test("does not accept an elevated secret as the dashboard auth key", () => {
  const original = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_secret_must_not_be_used";
  try { assert.throws(getAuthConfig, ServiceError); }
  finally { process.env.SUPABASE_PUBLISHABLE_KEY = original; }
});

test("does not send account credentials to an insecure remote Auth endpoint", () => {
  const original = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = "http://unsafe.example.com";
  try { assert.throws(getAuthConfig, ServiceError); }
  finally { process.env.SUPABASE_URL = original; }
});

test("auth rate limits reject repeated attempts before another provider request", async () => {
  const headers = { "x-forwarded-for": "limited-auth-client" };
  for (let attempt = 0; attempt < 10; attempt++) {
    assert.equal((await login(request("/api/auth/login", "POST", { ...credentials, password: "wrong" }, headers))).status, 401);
  }
  const providerCalls = fixture.calls.length;
  const response = await login(request("/api/auth/login", "POST", credentials, headers));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
  assert.equal(fixture.calls.length, providerCalls);
});

test("successful login sets HttpOnly cookie without returning tokens in JSON", async () => {
  const response = await login(request("/api/auth/login", "POST", credentials));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "signedIn" });
  const cookie = response.headers.get("set-cookie")!;
  assert.match(cookie, /pendek-auth=/); assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=lax/i);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("wrong password returns a generic localized failure and no session cookie", async () => {
  const response = await login(request("/api/auth/login", "POST", { ...credentials, password: "incorrect" }));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.match((await response.json()).error, /email\/password is incorrect/);
});

test("cross-origin or missing-origin auth mutations do not reach Supabase", async () => {
  for (const Origin of ["https://evil.example", ""]) assert.equal((await login(request("/api/auth/login", "POST", credentials, { Origin }))).status, 403);
  assert.equal(fixture.calls.length, 0);
});

test("registration returns confirmation state and a PKCE verifier for a fixed callback", async () => {
  const response = await register(request("/api/auth/register", "POST", credentials));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "checkEmail" });
  assert.match(response.headers.get("set-cookie")!, /pendek-auth-code-verifier/);
  assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
  assert.ok(fixture.calls.some((call) => call.path === "/auth/v1/signup"));
});

test("registration can start a session when confirmation is disabled in Supabase", async () => {
  fixture.state.requireConfirmation = false;
  const response = await register(request("/api/auth/register", "POST", credentials));
  assert.deepEqual(await response.json(), { status: "signedIn" });
  assert.match(response.headers.get("set-cookie")!, /pendek-auth=/);
});

test("cookie sessions are Secure for HTTPS origins", async () => {
  process.env.APP_URL = "https://example.com";
  const response = await login(new Request("https://example.com/api/auth/login", { method: "POST", headers: { Origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify(credentials) }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie")!, /Secure/);
});

test("dashboard APIs require a verified session", async () => {
  assert.equal((await list(request("/api/dashboard/links"))).status, 401);
  assert.equal((await create(request("/api/dashboard/links", "POST", { url: "https://example.com" }))).status, 401);
  const session = fixtureSession(); session.access_token = "not-a-valid-token";
  const forgedCookie = `pendek-auth=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  assert.equal((await list(request("/api/dashboard/links", "GET", undefined, { Cookie: forgedCookie }))).status, 401);
});

test("dashboard only lists the verified user's rows, excluding another owner and anonymous links", async () => {
  fixture.rows.set("Alice001", { code: "Alice001", target_url: "https://example.com/alice", created_at: "2026-10-13T00:00:00Z", owner_id: USER_A });
  fixture.rows.set("Bob00001", { code: "Bob00001", target_url: "https://example.com/bob", created_at: "2026-10-13T00:00:00Z", owner_id: USER_B });
  fixture.rows.set("Anon0001", { code: "Anon0001", target_url: "https://example.com/anonymous", created_at: "2026-10-13T00:00:00Z", owner_id: null });
  const response = await list(request(`/api/dashboard/links?owner_id=${USER_B}`, "GET", undefined, { Cookie: sessionCookie(USER_A) }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.links.map((row: { code: string }) => row.code), ["Alice001"]);
  assert.equal(data.total, 1);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("forged user information in a cookie never overrides the Auth server's user", async () => {
  fixture.rows.set("Bob00001", { code: "Bob00001", target_url: "https://example.com/bob", created_at: "2026-10-13T00:00:00Z", owner_id: USER_B });
  const response = await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie(USER_B, USER_A) }));
  assert.deepEqual((await response.json()).links.map((row: { code: string }) => row.code), ["Bob00001"]);
});

test("owned creation ignores submitted owner IDs and sends the user JWT to the database", async () => {
  const response = await create(request("/api/dashboard/links", "POST", { url: "https://example.com/article", owner_id: USER_B }, { Cookie: sessionCookie(USER_A) }));
  assert.equal(response.status, 201);
  const link = await response.json();
  assert.equal(fixture.rows.get(link.code)?.owner_id, USER_A);
  assert.ok(fixture.calls.some((call) => call.path === "/rest/v1/links" && call.authorization?.endsWith(".fixture")));
});

test("owned creation retries collisions and rejects unsafe destinations", async () => {
  fixture.state.collisions = 2;
  const response = await create(request("/api/dashboard/links", "POST", { url: "https://example.com" }, { Cookie: sessionCookie() }));
  assert.equal(response.status, 201);
  assert.equal(fixture.calls.filter((call) => call.path === "/rest/v1/links").length, 3);
  assert.equal((await create(request("/api/dashboard/links", "POST", { url: "javascript:alert(1)" }, { Cookie: sessionCookie() }))).status, 400);
});

test("owned custom aliases retain verified ownership and support listing and deletion", async () => {
  const response = await create(request("/api/dashboard/links", "POST", { url: "https://example.com/custom", alias: "my-course_2026", owner_id: USER_B }, { Cookie: sessionCookie(USER_A) }));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).code, "my-course_2026");
  assert.equal(fixture.rows.get("my-course_2026")?.owner_id, USER_A);
  const owned = await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }));
  assert.equal((await owned.json()).links[0].code, "my-course_2026");
  const deleted = await remove(request("/api/dashboard/links/my-course_2026", "DELETE", undefined, { Cookie: sessionCookie() }), { params: Promise.resolve({ code: "my-course_2026" }) });
  assert.equal(deleted.status, 200);
  assert.equal(fixture.rows.size, 0);
});

test("dashboard alias validation rejects malformed input before a database insert", async () => {
  const response = await create(request("/api/dashboard/links", "POST", { url: "https://example.com", alias: "has spaces" }, { Cookie: sessionCookie() }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).field, "alias");
  assert.ok(!fixture.calls.some((call) => call.path === "/rest/v1/links"));
});

test("aliases conflict globally with other owners and anonymous links without revealing destinations", async () => {
  for (const owner of [USER_B, null]) {
    fixture.rows.set("taken-alias", { code: "taken-alias", target_url: "https://example.com/private-original", created_at: "2026-10-13T00:00:00Z", owner_id: owner });
    fixture.calls.length = 0;
    const response = await create(request("/api/dashboard/links", "POST", { url: "https://example.com/replacement", alias: "taken-alias" }, { Cookie: sessionCookie() }));
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "This alias is already taken. Choose another alias or leave it empty for an automatic code.", field: "alias" });
    assert.equal(fixture.calls.filter((call) => call.path === "/rest/v1/links").length, 1);
    assert.equal(fixture.rows.get("taken-alias")?.target_url, "https://example.com/private-original");
    assert.equal(fixture.rows.get("taken-alias")?.owner_id, owner);
  }
});

test("another user's link cannot be deleted and own deletion removes only the target row", async () => {
  fixture.rows.set("Alice001", { code: "Alice001", target_url: "https://example.com/a", created_at: "2026-10-13T00:00:00Z", owner_id: USER_A });
  fixture.rows.set("Bob00001", { code: "Bob00001", target_url: "https://example.com/b", created_at: "2026-10-13T00:00:00Z", owner_id: USER_B });
  const removeCode = (code: string) => remove(request(`/api/dashboard/links/${code}`, "DELETE", undefined, { Cookie: sessionCookie(USER_A) }), { params: Promise.resolve({ code }) });
  assert.equal((await removeCode("Bob00001")).status, 404);
  assert.ok(fixture.rows.has("Bob00001"));
  assert.equal((await removeCode("Alice001")).status, 200);
  assert.ok(!fixture.rows.has("Alice001"));
  assert.equal(fixture.state.deleted, 1);
});

test("cross-origin delete is rejected before modifying rows", async () => {
  const response = await remove(request("/api/dashboard/links/Alice001", "DELETE", undefined, { Cookie: sessionCookie(), Origin: "https://evil.example" }), { params: Promise.resolve({ code: "Alice001" }) });
  assert.equal(response.status, 403);
  assert.equal(fixture.state.deleted, 0);
});

test("pagination returns a bounded page with the owner's real count", async () => {
  for (let i = 0; i < 25; i++) { const code = `Code${String(i).padStart(4, "0")}`; fixture.rows.set(code, { code, target_url: `https://example.com/${i}`, created_at: "2026-10-13T00:00:00Z", owner_id: USER_A }); }
  const response = await list(request("/api/dashboard/links?page=2", "GET", undefined, { Cookie: sessionCookie() }));
  const data = await response.json();
  assert.equal(data.links.length, 5); assert.equal(data.total, 25); assert.equal(data.page, 2);
  assert.equal((await list(request("/api/dashboard/links?page=-1", "GET", undefined, { Cookie: sessionCookie() }))).status, 400);
});

test("visit totals include every owned page and exclude other owners and anonymous links", async () => {
  for (let i = 0; i < 25; i++) {
    const code = `Count${String(i).padStart(3, "0")}`;
    fixture.rows.set(code, { code, target_url: "https://example.com", created_at: "2026-10-13T00:00:00Z", owner_id: USER_A, visit_count: i + 1 });
  }
  fixture.rows.set("other-owner", { code: "other-owner", target_url: "https://example.com", created_at: "2026-10-13T00:00:00Z", owner_id: USER_B, visit_count: 1000 });
  fixture.rows.set("anonymous", { code: "anonymous", target_url: "https://example.com", created_at: "2026-10-13T00:00:00Z", owner_id: null, visit_count: 2000 });
  const response = await list(request(`/api/dashboard/links?page=2&owner_id=${USER_B}`, "GET", undefined, { Cookie: sessionCookie() }));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.links.length, 5);
  assert.equal(data.totalVisits, 325);
  assert.deepEqual(data.links.map((row: { visitCount: number }) => row.visitCount), [21, 22, 23, 24, 25]);
});

test("new links start at zero visits even when the request supplies a fake counter", async () => {
  const response = await create(request("/api/dashboard/links", "POST", { url: "https://example.com", visit_count: 1000, visitCount: 999 }, { Cookie: sessionCookie() }));
  const link = await response.json();
  assert.equal(response.status, 201);
  assert.equal(fixture.rows.get(link.code)?.visit_count, 0);
  assert.equal(fixture.calls.find(call => call.path === "/rest/v1/links" && call.method === "POST")?.body?.visit_count, undefined);
});

test("empty accounts have a real zero total, and deleting a link removes its visits from the total", async () => {
  const empty = await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }));
  assert.equal((await empty.json()).totalVisits, 0);
  fixture.rows.set("visited", { code: "visited", target_url: "https://example.com", created_at: "2026-10-13T00:00:00Z", owner_id: USER_A, visit_count: 7 });
  const before = await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }));
  assert.equal((await before.json()).totalVisits, 7);
  await remove(request("/api/dashboard/links/visited", "DELETE", undefined, { Cookie: sessionCookie() }), { params: Promise.resolve({ code: "visited" }) });
  const after = await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }));
  assert.equal((await after.json()).totalVisits, 0);
});

test("missing or invalid visit totals return a service error instead of fabricated statistics", async () => {
  fixture.state.failVisitTotal = true;
  const response = await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }));
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("private fixture detail"));
  fixture.state.failVisitTotal = false;
  for (const value of [null, "12", -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    fixture.state.visitTotalOverride = value;
    assert.equal((await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }))).status, 503);
  }
});

test("invalid per-link counters are rejected even when the aggregate is valid", async () => {
  fixture.state.visitTotalOverride = 0;
  for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    fixture.rows.set("bad-counter", { code: "bad-counter", target_url: "https://example.com", created_at: "2026-10-13T00:00:00Z", owner_id: USER_A, visit_count: value });
    assert.equal((await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }))).status, 503);
  }
});

test("logout clears cookies and signs out only the current session", async () => {
  const response = await logout(request("/api/auth/logout", "POST", undefined, { Cookie: sessionCookie() }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie")!, /Max-Age=0/);
  assert.equal(fixture.state.logoutScope, "local");
});

test("callback exchanges PKCE code without accepting an external redirect", async () => {
  const verifier = `pendek-auth-code-verifier=base64-${Buffer.from(JSON.stringify("fixture-verifier")).toString("base64url")}`;
  const response = await callback(request("/en/auth/callback?code=good-code&next=https://evil.example", "GET", undefined, { Cookie: verifier }), { params: Promise.resolve({ locale: "en" }) });
  assert.equal(response.headers.get("location"), `${appOrigin}/en/dashboard`);
  assert.match(response.headers.get("set-cookie")!, /pendek-auth=/);
  const missing = await callback(request("/en/auth/callback"), { params: Promise.resolve({ locale: "en" }) });
  assert.equal(missing.headers.get("location"), `${appOrigin}/en/login?notice=confirmationFailed`);
});

test("Proxy refreshes expired tokens and forwards new cookies privately", async () => {
  const session = fixtureSession(); session.expires_at = Math.floor(Date.now() / 1000) - 10;
  const Cookie = `pendek-auth=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const response = await proxy(new NextRequest(`${appOrigin}/en/dashboard`, { headers: { Cookie } }));
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.match(response.headers.get("set-cookie")!, /pendek-auth=/);
  assert.equal(fixture.state.refreshes, 1);
  assert.ok(response.headers.get("x-middleware-request-cookie")?.includes("pendek-auth="));
});

test("Auth service failures return localized 503 errors without leaking provider details", async () => {
  fixture.state.unavailable = true;
  const response = await login(request("/api/auth/login", "POST", credentials));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.ok(!body.error.includes("private fixture detail"));
  assert.ok(!body.error.includes("sb_publishable"));
});

test("temporary identity-provider rate limits do not pretend the session is signed out", async () => {
  fixture.state.authRateLimited = true;
  const response = await list(request("/api/dashboard/links", "GET", undefined, { Cookie: sessionCookie() }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("set-cookie"), null);
});

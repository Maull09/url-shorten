import assert from "node:assert/strict";
import { createServer, type IncomingMessage } from "node:http";
import { after, before, beforeEach, test } from "node:test";
import { POST } from "../src/app/api/links/route";
import { GET, HEAD } from "../src/app/s/[code]/route";
import { createLink, findLink } from "../src/lib/links";
import { ServiceError } from "../src/lib/errors";
import { SHORT_CODE_PATTERN } from "../src/lib/url";

type Row = { code: string; target_url: string; created_at: string; visit_count?: number };
const rows = new Map<string, Row>();
let collisionCount = 0;
let failDatabase = false;
let inserts = 0;
let lookups = 0;
let visitCalls = 0;
let failVisitRecording = false;
let removeBeforeRecording = false;
let requestId = 0;
const previousUrl = process.env.SUPABASE_URL;
const previousKey = process.env.SUPABASE_SECRET_KEY;

async function parseBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString()) as { code: string; target_url: string; link_code?: string; expected_target_url?: string };
}

// Emulate the Supabase REST boundary only; production always uses Supabase.
const database = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  assert.equal(request.headers.apikey, "sb_secret_test_fixture");
  const url = new URL(request.url!, "http://localhost");

  if (failDatabase) {
    response.writeHead(500).end(JSON.stringify({ code: "XX000", message: "private database detail" }));
    return;
  }

  if (request.method === "POST") {
    if (url.pathname === "/rest/v1/rpc/record_link_visit") {
      visitCalls++;
      const body = await parseBody(request);
      if (failVisitRecording) { response.writeHead(500).end(JSON.stringify({ code: "XX000", message: "private visit detail" })); return; }
      if (removeBeforeRecording) rows.delete(body.link_code ?? "");
      const row = rows.get(body.link_code ?? "");
      const found = Boolean(row && row.target_url === body.expected_target_url);
      if (row && found) row.visit_count = (row.visit_count ?? 0) + 1;
      response.end(JSON.stringify(found)); return;
    }
    inserts++;
    const body = await parseBody(request);

    if (collisionCount-- > 0 || rows.has(body.code)) {
      response.writeHead(409).end(JSON.stringify({ code: "23505", message: "duplicate key" }));
      return;
    }

    const row = { ...body, created_at: "2026-10-13T00:00:00.000Z", visit_count: 0 };
    rows.set(row.code, row);
    response.writeHead(201).end(JSON.stringify(row));
    return;
  }

  lookups++;
  const code = url.searchParams.get("code")?.replace(/^eq\./, "");
  const row = rows.get(code ?? "");
  response.end(JSON.stringify(row ? [{ target_url: row.target_url }] : []));
});

before(async () => {
  await new Promise<void>((resolve) => database.listen(0, "127.0.0.1", resolve));
  const address = database.address();
  assert.ok(address && typeof address !== "string");
  process.env.SUPABASE_URL = `http://127.0.0.1:${address.port}`;
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test_fixture";
});

beforeEach(() => {
  rows.clear();
  collisionCount = 0;
  failDatabase = false;
  inserts = 0;
  lookups = 0;
  visitCalls = 0;
  failVisitRecording = false;
  removeBeforeRecording = false;
});

after(async () => {
  if (previousUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = previousUrl;
  if (previousKey === undefined) delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY = previousKey;
  await new Promise<void>((resolve, reject) => database.close((error) => error ? reject(error) : resolve()));
});

function createRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `test-${requestId++}`, ...headers },
    body,
  });
}

function openLink(code: string) {
  return GET(new Request(`http://localhost:3000/s/${code}`), { params: Promise.resolve({ code }) });
}

test("localizes API validation errors and response language without changing status codes", async () => {
  const response = await POST(createRequest('{"url":"javascript:alert(1)"}', { "Accept-Language": "en-US,en;q=0.9" }));
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("content-language"), "en");
  assert.deepEqual(await response.json(), { error: "Use a complete URL starting with https:// or http://." });
  assert.equal(inserts, 0);

  const defaultResponse = await POST(createRequest("{}"));
  assert.equal(defaultResponse.headers.get("content-language"), "id");
  assert.deepEqual(await defaultResponse.json(), { error: "Masukkan URL yang ingin dipendekkan." });
});

test("localizes service errors without exposing database details", async () => {
  failDatabase = true;
  const response = await POST(createRequest('{"url":"https://example.com"}', { "Accept-Language": "en" }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("content-language"), "en");
  assert.deepEqual(await response.json(), { error: "The link could not be created. The service is unavailable; please try again later." });
});

test("localizes request-boundary errors", async () => {
  const cases: Array<{ body: string; headers: Record<string, string>; status: number; message: string }> = [
    { body: "{}", headers: { Origin: "https://other.example.com" }, status: 403, message: "The request must come from this application." },
    { body: "{}", headers: { "Content-Type": "text/plain" }, status: 415, message: "Send the request with Content-Type application/json." },
    { body: "not-json", headers: {}, status: 400, message: "The request is not valid. Send the URL in JSON format." },
  ];

  for (const entry of cases) {
    const response = await POST(createRequest(entry.body, { ...entry.headers, "Accept-Language": "en" }));
    assert.equal(response.status, entry.status);
    assert.equal(response.headers.get("content-language"), "en");
    assert.deepEqual(await response.json(), { error: entry.message });
  }
  assert.equal(inserts, 0);
});

test("localizes missing short-link errors and points to the matching language homepage", async () => {
  const response = await GET(new Request("http://localhost:3000/s/invalid!", { headers: { "Accept-Language": "en" } }), { params: Promise.resolve({ code: "invalid!" }) });
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("content-language"), "en");
  assert.equal(await response.text(), "Link not found. Check the address or ask the sender for a new link.\n\nCreate a link: /en");
  assert.equal(lookups, 0);
});

test("stores a link and retrieves the destination via the REST client", async () => {
  const link = await createLink("https://example.com/article?source=test");
  assert.ok(SHORT_CODE_PATTERN.test(link.code));
  assert.equal(link.targetUrl, "https://example.com/article?source=test");
  assert.equal(link.createdAt, "2026-10-13T00:00:00.000Z");
  assert.equal(await findLink(link.code), link.targetUrl);
});

test("retries code collisions without overwriting another link", async () => {
  collisionCount = 2;
  const link = await createLink("https://example.com/");
  assert.equal(inserts, 3);
  assert.equal(rows.get(link.code)?.target_url, "https://example.com/");
});

test("stops after three collisions", async () => {
  collisionCount = 3;
  await assert.rejects(() => createLink("https://example.com/"), ServiceError);
  assert.equal(inserts, 3);
  assert.equal(rows.size, 0);
});

test("creates a link through POST and redirects with an uncached 302", async () => {
  const response = await POST(createRequest(JSON.stringify({ url: "https://example.com/article?q=1#intro" })));
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const link = await response.json();
  const redirect = await openLink(link.code);
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("location"), "https://example.com/article?q=1#intro");
  assert.equal(redirect.headers.get("cache-control"), "no-store");
  assert.equal(rows.get(link.code)?.visit_count, 1);
});

test("each repeated or concurrent GET records a visit before redirecting", async () => {
  const link = await createLink("https://example.com", "count-visits");
  const responses = await Promise.all(Array.from({ length: 20 }, () => openLink(link.code)));
  assert.ok(responses.every(response => response.status === 302));
  assert.equal(rows.get(link.code)?.visit_count, 20);
  assert.equal(visitCalls, 20);
});

test("HEAD returns redirect headers without recording visits or returning a body", async () => {
  const link = await createLink("https://example.com", "head-check");
  const response = await HEAD(new Request(`http://localhost:3000/s/${link.code}`, { method: "HEAD" }), { params: Promise.resolve({ code: link.code }) });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://example.com/");
  assert.equal(await response.text(), "");
  assert.equal(rows.get(link.code)?.visit_count, 0);
  assert.equal(visitCalls, 0);
});

test("missing, malformed, and unsafe destinations never record visits", async () => {
  assert.equal((await openLink("missing-link")).status, 404);
  assert.equal((await openLink("invalid!")).status, 404);
  rows.set("unsafe-link", { code: "unsafe-link", target_url: "javascript:alert(1)", created_at: "" });
  assert.equal((await openLink("unsafe-link")).status, 503);
  assert.equal(visitCalls, 0);
});

test("visit recording failure returns a private-detail-free 503 instead of an uncounted redirect", async () => {
  const link = await createLink("https://example.com", "failed-count");
  failVisitRecording = true;
  const response = await openLink(link.code);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("location"), null);
  assert.ok(!(await response.text()).includes("private visit detail"));
  assert.equal(rows.get(link.code)?.visit_count, 0);
});

test("a link deleted between lookup and recording no longer redirects", async () => {
  const link = await createLink("https://example.com", "deleted-link");
  removeBeforeRecording = true;
  const response = await openLink(link.code);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("location"), null);
});

test("creates and redirects a case-sensitive custom alias with hyphens and underscores", async () => {
  const response = await POST(createRequest(JSON.stringify({ url: "https://example.com/custom", alias: "  Learn-next_123  " })));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).code, "Learn-next_123");
  assert.equal((await openLink("Learn-next_123")).headers.get("location"), "https://example.com/custom");
  assert.equal((await openLink("learn-next_123")).status, 404);
});

test("blank aliases still create eight-character automatic codes", async () => {
  for (const alias of ["", "   "]) {
    const response = await POST(createRequest(JSON.stringify({ url: "https://example.com/", alias })));
    assert.equal(response.status, 201);
    assert.match((await response.json()).code, /^[A-Za-z0-9]{8}$/);
  }
});

test("invalid aliases return localized field errors without a database insert", async () => {
  for (const alias of [null, 123, "ab", "a".repeat(33), "hello world", "a/b", "abc?x"]) {
    const response = await POST(createRequest(JSON.stringify({ url: "https://example.com/", alias }), { "Accept-Language": "en" }));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Use 3–32 letters, digits, hyphens (-) or underscores (_) for the alias.", field: "alias" });
  }
  assert.equal(inserts, 0);
});

test("an occupied alias returns 409 once and never overwrites or substitutes a code", async () => {
  await createLink("https://example.com/original", "my-link");
  inserts = 0;
  const response = await POST(createRequest(JSON.stringify({ url: "https://example.com/replacement", alias: "my-link" })));
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "Alias ini sudah dipakai. Pilih alias lain atau kosongkan untuk kode otomatis.", field: "alias" });
  assert.equal(inserts, 1);
  assert.equal(rows.size, 1);
  assert.equal(await findLink("my-link"), "https://example.com/original");
});

test("simultaneous requests for the same alias produce one success and one conflict", async () => {
  const responses = await Promise.all(["first", "second"].map((path) => POST(createRequest(JSON.stringify({ url: `https://example.com/${path}`, alias: "shared-alias" })))));
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(rows.size, 1);
  const winner = responses.findIndex((response) => response.status === 201);
  assert.equal(await findLink("shared-alias"), `https://example.com/${winner === 0 ? "first" : "second"}`);
});

test("rejects malformed payloads and unsafe protocols without inserting", async () => {
  for (const body of ["not-json", "null", "[]", "{}", JSON.stringify({ url: "javascript:alert(1)" })]) {
    assert.equal((await POST(createRequest(body))).status, 400);
  }
  assert.equal(inserts, 0);
});

test("bounds request bodies even when Content-Length is spoofed", async () => {
  const response = await POST(createRequest(JSON.stringify({ url: "a".repeat(10_000) }), { "Content-Length": "1" }));
  assert.equal(response.status, 400);
  assert.equal(inserts, 0);
});

test("rejects cross-origin requests and unsupported content types", async () => {
  assert.equal((await POST(createRequest("{}", { Origin: "https://another-site.example" }))).status, 403);
  assert.equal((await POST(createRequest("{}", { "Content-Type": "text/plain" }))).status, 415);
  assert.equal(inserts, 0);
});

test("accepts the browser origin when Next uses an internal listening address", async () => {
  const headers = { Host: "127.0.0.1:3007", Origin: "http://127.0.0.1:3007" };
  assert.equal((await POST(createRequest('{"url":"https://example.com"}', headers))).status, 201);
  assert.equal((await POST(createRequest('{"url":"http://127.0.0.1:3007/s/Ab3k9X2m"}', headers))).status, 400);
});

test("respects the protocol of a trusted reverse proxy", async () => {
  const headers = { Host: "short.example.com", "x-forwarded-proto": "https", Origin: "https://short.example.com" };
  assert.equal((await POST(createRequest('{"url":"https://example.com"}', headers))).status, 201);
  assert.equal((await POST(createRequest('{"url":"https://example.com"}', { ...headers, Origin: "https://other.example.com" }))).status, 403);
});

test("returns Retry-After once a client's creation limit is reached", async () => {
  const headers = { "x-forwarded-for": "limited-test-client", "Accept-Language": "en" };
  for (let index = 0; index < 10; index++) {
    assert.equal((await POST(createRequest('{"url":"https://example.com"}', headers))).status, 201);
  }
  const response = await POST(createRequest('{"url":"https://example.com"}', headers));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
  assert.equal(response.headers.get("content-language"), "en");
  assert.deepEqual(await response.json(), { error: `Too many attempts. Try again in ${response.headers.get("retry-after")} seconds.` });
  assert.equal(inserts, 10);
});

test("returns 404 for unknown codes and skips lookup for invalid codes", async () => {
  assert.equal((await openLink("Ab3k9X2m")).status, 404);
  const lookupCount = lookups;
  assert.equal((await openLink("invalid!")).status, 404);
  assert.equal(lookups, lookupCount);
});

test("never redirects to an unsafe destination inserted outside the application", async () => {
  rows.set("Ab3k9X2m", { code: "Ab3k9X2m", target_url: "javascript:alert(1)", created_at: "" });
  const response = await openLink("Ab3k9X2m");
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("location"), null);
});

test("handles database failure without exposing internal details or fabricating a link", async () => {
  failDatabase = true;
  const response = await POST(createRequest('{"url":"https://example.com"}'));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, undefined);
  assert.ok(!body.error.includes("private database detail"));
  assert.ok(!body.error.includes("sb_secret"));
  assert.equal((await openLink("Ab3k9X2m")).status, 503);
});

test("missing configuration returns service unavailable", async () => {
  const secret = process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  try {
    assert.equal((await POST(createRequest('{"url":"https://example.com"}'))).status, 503);
    assert.equal((await openLink("Ab3k9X2m")).status, 503);
  } finally {
    process.env.SUPABASE_SECRET_KEY = secret;
  }
});

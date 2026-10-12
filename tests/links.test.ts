import assert from "node:assert/strict";
import { createServer, type IncomingMessage } from "node:http";
import { after, before, beforeEach, test } from "node:test";
import { POST } from "../src/app/api/links/route";
import { GET } from "../src/app/s/[code]/route";
import { createLink, findLink } from "../src/lib/links";
import { ServiceError } from "../src/lib/errors";
import { SHORT_CODE_PATTERN } from "../src/lib/url";

type Row = { code: string; target_url: string; created_at: string };
const rows = new Map<string, Row>();
let collisionCount = 0;
let failDatabase = false;
let inserts = 0;
let lookups = 0;
let requestId = 0;
const previousUrl = process.env.SUPABASE_URL;
const previousKey = process.env.SUPABASE_SECRET_KEY;

async function parseBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString()) as { code: string; target_url: string };
}

// Emulate the Supabase REST boundary only; production always uses Supabase.
const database = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  assert.equal(request.headers.apikey, "sb_secret_test_fixture");

  if (failDatabase) {
    response.writeHead(500).end(JSON.stringify({ code: "XX000", message: "private database detail" }));
    return;
  }

  if (request.method === "POST") {
    inserts++;
    const body = await parseBody(request);

    if (collisionCount-- > 0) {
      response.writeHead(409).end(JSON.stringify({ code: "23505", message: "duplicate key" }));
      return;
    }

    const row = { ...body, created_at: "2026-10-13T00:00:00.000Z" };
    rows.set(row.code, row);
    response.writeHead(201).end(JSON.stringify(row));
    return;
  }

  lookups++;
  const url = new URL(request.url!, "http://localhost");
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
  const headers = { "x-forwarded-for": "limited-test-client" };
  for (let index = 0; index < 10; index++) {
    assert.equal((await POST(createRequest('{"url":"https://example.com"}', headers))).status, 201);
  }
  const response = await POST(createRequest('{"url":"https://example.com"}', headers));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
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

import { createServer, type IncomingMessage } from "node:http";

export const USER_A = "11111111-1111-4111-8111-111111111111";
export const USER_B = "22222222-2222-4222-8222-222222222222";
export type FixtureRow = { code: string; target_url: string; created_at: string; owner_id: string | null };

export function fixtureUser(id: string) {
  return { id, aud: "authenticated", role: "authenticated", email: id === USER_A ? "alice@example.com" : "bob@example.com", email_confirmed_at: "2026-01-01T00:00:00Z", app_metadata: { provider: "email" }, user_metadata: {}, identities: [], created_at: "2026-01-01T00:00:00Z" };
}

export function fixtureSession(id = USER_A) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encoded = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return { access_token: `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({ sub: id, role: "authenticated", exp: expires })}.fixture`, refresh_token: `refresh-${id}`, token_type: "bearer", expires_in: 3600, expires_at: expires, user: fixtureUser(id) };
}

export function sessionCookie(id = USER_A, claimedId = id) {
  const session = { ...fixtureSession(id), user: fixtureUser(claimedId) };
  return `pendek-auth=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
}

async function bodyOf(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString() || "{}") as Record<string, string>;
}

export function createAuthFixture() {
  const rows = new Map<string, FixtureRow>();
  const calls: { path: string; method: string; authorization?: string; body?: Record<string, string> }[] = [];
  const state = { unavailable: false, authRateLimited: false, requireConfirmation: true, collisions: 0, deleted: 0, refreshes: 0, logoutScope: "" };
  const server = createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json");
    const url = new URL(request.url!, "http://localhost");
    const body = request.method === "POST" ? await bodyOf(request) : undefined;
    calls.push({ path: url.pathname, method: request.method!, authorization: request.headers.authorization, body });
    if (state.unavailable) { response.writeHead(500).end(JSON.stringify({ code: "unexpected_failure", msg: "private fixture detail" })); return; }
    const token = request.headers.authorization?.replace(/^Bearer /, "");
    const id = token === fixtureSession(USER_A).access_token ? USER_A : token === fixtureSession(USER_B).access_token ? USER_B : null;
    // JWT expiry changes by seconds: resolve the signed-in ID from fixture payload.
    let tokenId = id;
    try {
      const payload = JSON.parse(Buffer.from(token?.split(".")[1] ?? "", "base64url").toString());
      if (token?.endsWith(".fixture") && [USER_A, USER_B].includes(payload.sub)) tokenId = payload.sub;
    } catch {}
    const send = (value: unknown, status = 200) => response.writeHead(status).end(JSON.stringify(value));
    if (url.pathname === "/auth/v1/token") {
      if (url.searchParams.get("grant_type") === "refresh_token") {
        state.refreshes++;
        if (body?.refresh_token === `refresh-${USER_A}`) { send(fixtureSession(USER_A)); return; }
        send({ code: "refresh_token_not_found", msg: "Invalid refresh token" }, 400); return;
      }
      if (url.searchParams.get("grant_type") === "pkce") {
        if (body?.auth_code === "good-code" && body.code_verifier) { send(fixtureSession(USER_A)); return; }
        send({ code: "flow_state_not_found", msg: "Invalid code" }, 400); return;
      }
      if (body?.password === "correct-password" && ["alice@example.com", "bob@example.com"].includes(body.email)) {
        send(fixtureSession(body.email === "alice@example.com" ? USER_A : USER_B)); return;
      }
      send({ code: "invalid_credentials", msg: "Invalid login" }, 400); return;
    }
    if (url.pathname === "/auth/v1/signup") { send(state.requireConfirmation ? fixtureUser(USER_A) : fixtureSession(USER_A)); return; }
    if (url.pathname === "/auth/v1/user") {
      if (state.authRateLimited) { send({ code: "over_request_rate_limit", msg: "Too many requests" }, 429); return; }
      if (tokenId) send(fixtureUser(tokenId));
      else send({ code: "bad_jwt", msg: "Invalid token" }, 401);
      return;
    }
    if (url.pathname === "/auth/v1/logout") { state.logoutScope = url.searchParams.get("scope") ?? ""; response.writeHead(204).end(); return; }
    if (url.pathname !== "/rest/v1/links") { send({ message: "Unknown fixture route" }, 404); return; }
    if (request.method === "GET" && request.headers.apikey === "sb_secret_test_fixture") {
      const publicCode = url.searchParams.get("code")?.replace(/^eq\./, "");
      if (!publicCode) { send({ code: "42501", message: "Fixture only permits public code lookup" }, 403); return; }
      const row = rows.get(publicCode);
      send(row ? [{ target_url: row.target_url }] : []); return;
    }
    if (request.headers.apikey !== "sb_publishable_fixture" || !tokenId) { send({ code: "42501", message: "Auth required" }, 403); return; }
    const owner = url.searchParams.get("owner_id")?.replace(/^eq\./, "");
    const code = url.searchParams.get("code")?.replace(/^eq\./, "");
    if (request.method === "POST") {
      if (body?.owner_id !== tokenId) { send({ code: "42501", message: "RLS rejection" }, 403); return; }
      if (state.collisions-- > 0 || rows.has(body.code)) { send({ code: "23505", message: "duplicate code" }, 409); return; }
      const row: FixtureRow = { code: body.code, target_url: body.target_url, owner_id: body.owner_id, created_at: "2026-10-13T00:00:00Z" };
      rows.set(row.code, row);
      send({ code: row.code, target_url: row.target_url, created_at: row.created_at }, 201); return;
    }
    const owned = [...rows.values()].filter((row) => row.owner_id === tokenId && row.owner_id === owner && (!code || code === row.code));
    if (request.method === "DELETE") {
      for (const row of owned) { rows.delete(row.code); state.deleted++; }
      send(owned.map(({ code }) => ({ code }))); return;
    }
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    response.setHeader("Content-Range", `${offset}-${Math.max(offset, offset + Math.min(limit, owned.length) - 1)}/${owned.length}`);
    send(owned.slice(offset, offset + limit).map(({ code, target_url, created_at }) => ({ code, target_url, created_at })));
  });
  return { server, rows, calls, state };
}

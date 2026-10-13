import "server-only";
import { NextRequest, NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { createAuthClient, getVerifiedUser, hasSessionCookie } from "./client";
import { AuthRequiredError } from "@/lib/errors";

export function createRouteAuth(request: Request) {
  const jar = new NextRequest(request.url, { headers: request.headers }).cookies;
  const changes: { name: string; value: string; options: CookieOptions }[] = [];
  const cacheHeaders: Record<string, string> = {};
  const client = createAuthClient({
    getAll: () => jar.getAll(),
    setAll: (cookies, headers) => {
      for (const cookie of cookies) {
        jar.set(cookie.name, cookie.value);
        changes.push(cookie);
      }
      Object.assign(cacheHeaders, headers);
    },
  });

  function finish(response: NextResponse) {
    for (const { name, value, options } of changes) response.cookies.set(name, value, options);
    for (const [name, value] of Object.entries(cacheHeaders)) response.headers.set(name, value);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return { client, finish };
}

export async function requireRouteUser(request: Request) {
  const jar = new NextRequest(request.url, { headers: request.headers }).cookies;
  if (!hasSessionCookie(jar.getAll())) throw new AuthRequiredError();
  const auth = createRouteAuth(request);
  const user = await getVerifiedUser(auth.client);
  return { ...auth, user };
}

import "server-only";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { ServiceError } from "@/lib/errors";
import { getAuthConfig } from "./config";

export const AUTH_COOKIE_NAME = "pendek-auth";

export function hasSessionCookie(cookies: { name: string }[]): boolean {
  return cookies.some(({ name }) => /^pendek-auth(?:\.\d+)?$/.test(name));
}

export function createAuthClient(cookies: CookieMethodsServer) {
  const { url, key, origin } = getAuthConfig();
  return createServerClient(url, key, {
    cookieOptions: { name: AUTH_COOKIE_NAME, httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax", path: "/" },
    cookies,
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }),
    },
  });
}

export async function getVerifiedUser(client: ReturnType<typeof createAuthClient>) {
  const { data, error } = await client.auth.getUser();
  if (error && (error.status === 0 || error.status === 429 || (error.status ?? 0) >= 500 || error.name === "AuthRetryableFetchError")) {
    throw new ServiceError("Auth service is unavailable.");
  }
  return data.user;
}

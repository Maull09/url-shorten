import "server-only";
import { cookies } from "next/headers";
import { createAuthClient, getVerifiedUser, hasSessionCookie } from "./client";

export async function getServerAuth() {
  const store = await cookies();
  if (!hasSessionCookie(store.getAll())) return null;
  // Proxy writes refreshed cookies before server components read the session.
  const client = createAuthClient({ getAll: () => store.getAll(), setAll: () => {} });
  const user = await getVerifiedUser(client);
  return user ? { client, user } : null;
}

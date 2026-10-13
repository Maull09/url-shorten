import "server-only";
import { ServiceError } from "@/lib/errors";

function secureOrigin(value: string, name: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new ServiceError(`${name} is not a valid origin.`); }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new ServiceError(`${name} must be a secure origin.`);
  }
  return url.origin;
}

export function getAppOrigin(): string {
  const value = process.env.APP_URL;
  if (!value) throw new ServiceError("APP_URL is not configured.");
  return secureOrigin(value, "APP_URL");
}

export function getAuthConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_")) throw new ServiceError("Supabase Auth requires a publishable key.");
  return { url: secureOrigin(url, "SUPABASE_URL"), key, origin: getAppOrigin() };
}

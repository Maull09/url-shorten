import "server-only";
import { NextResponse } from "next/server";
import type { AuthError } from "@supabase/supabase-js";
import { getPreferredLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { AuthRequiredError, InputError } from "@/lib/errors";
import { getRequestOrigin } from "@/lib/request-origin";
import { readJson } from "@/lib/request-json";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAppOrigin } from "./config";

export function privateJson(body: unknown, status: number, locale: Locale, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "Content-Language": locale, ...headers } });
}

export function mutationGuard(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== getRequestOrigin(request) || origin !== getAppOrigin()) throw new InputError("origin");
}

export async function readPrivateJson(request: Request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) throw new InputError("contentType");
  try {
    return await readJson(request);
  } catch (error) {
    if (error instanceof InputError) throw new InputError("invalidRequest");
    throw error;
  }
}

export function limitMutation(request: Request, action: string, locale: Locale) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const retryAfter = checkRateLimit(`${action}:${ip}`);
  if (!retryAfter) return null;
  const message = getMessages(locale).errors.rateLimit.replace("{seconds}", String(retryAfter));
  return privateJson({ error: message }, 429, locale, { "Retry-After": String(retryAfter) });
}

export function authFailure(error: unknown, locale: Locale) {
  const messages = getMessages(locale);
  if (error instanceof AuthRequiredError) return privateJson({ error: messages.errors.authRequired }, 401, locale);
  if (error instanceof InputError) {
    const field = error.code === "aliasInvalid" || error.code === "aliasTaken" ? "alias" : undefined;
    const status = error.code === "aliasTaken" ? 409 : error.code === "origin" ? 403 : error.code === "contentType" ? 415 : 400;
    return privateJson({ error: messages.errors[error.code], ...(field ? { field } : {}) }, status, locale);
  }
  return privateJson({ error: messages.errors.authUnavailable }, 503, locale);
}

export function authProviderFailure(error: AuthError, locale: Locale, mode: "login" | "register") {
  const messages = getMessages(locale);
  if (error.status === 429) return privateJson({ error: messages.errors.authRateLimit }, 429, locale);
  if ((error.status ?? 0) >= 500 || error.name === "AuthRetryableFetchError") {
    return privateJson({ error: messages.errors.authUnavailable }, 503, locale);
  }
  return privateJson({ error: mode === "login" ? messages.errors.authInvalid : messages.errors.authRegistration }, mode === "login" ? 401 : 400, locale);
}

export function requestLocale(request: Request) {
  return getPreferredLocale(request.headers.get("accept-language"));
}

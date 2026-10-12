import { getPreferredLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { InputError } from "@/lib/errors";
import { createLink } from "@/lib/links";
import { checkRateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/request-json";
import { getRequestOrigin } from "@/lib/request-origin";
import { validateTargetUrl } from "@/lib/url";

export const runtime = "nodejs";

function json(body: unknown, status: number, locale: Locale, headers?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Language": locale, ...headers },
  });
}

export async function POST(request: Request) {
  const locale = getPreferredLocale(request.headers.get("accept-language"));
  const messages = getMessages(locale);
  const origin = getRequestOrigin(request);
  const callerOrigin = request.headers.get("origin");

  if (callerOrigin && callerOrigin !== origin) {
    return json({ error: messages.errors.origin }, 403, locale);
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return json({ error: messages.errors.contentType }, 415, locale);
  }

  try {
    const body = await readJson(request);

    if (!body || typeof body !== "object" || !("url" in body)) {
      throw new InputError("required");
    }

    const targetUrl = validateTargetUrl(body.url, origin);
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const retryAfter = checkRateLimit(clientIp);

    if (retryAfter) {
      return json(
        { error: messages.errors.rateLimit.replace("{seconds}", String(retryAfter)) },
        429,
        locale,
        { "Retry-After": String(retryAfter) },
      );
    }

    return json(await createLink(targetUrl), 201, locale);
  } catch (error) {
    if (error instanceof InputError) {
      return json({ error: messages.errors[error.code] }, 400, locale);
    }

    return json({ error: messages.errors.unavailable }, 503, locale);
  }
}

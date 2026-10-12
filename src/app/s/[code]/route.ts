import { getPreferredLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { findLink } from "@/lib/links";
import { getRequestOrigin } from "@/lib/request-origin";
import { SHORT_CODE_PATTERN, validateTargetUrl } from "@/lib/url";

export const runtime = "nodejs";

function errorResponse(status: 404 | 503, locale: Locale) {
  const messages = getMessages(locale);
  const message = status === 404
    ? messages.redirect.notFound
    : messages.redirect.unavailable;

  return new Response(`${message}\n\n${messages.redirect.create}: /${locale}`, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Language": locale,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const locale = getPreferredLocale(request.headers.get("accept-language"));
  const { code } = await context.params;

  if (!SHORT_CODE_PATTERN.test(code)) return errorResponse(404, locale);

  try {
    const destination = await findLink(code);

    if (!destination) return errorResponse(404, locale);

    // Revalidate stored data so an invalid database row cannot become a redirect.
    const targetUrl = validateTargetUrl(destination, getRequestOrigin(request));

    return new Response(null, {
      status: 302,
      headers: { Location: targetUrl, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    });
  } catch {
    return errorResponse(503, locale);
  }
}

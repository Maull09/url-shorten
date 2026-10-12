import { findLink } from "@/lib/links";
import { getRequestOrigin } from "@/lib/request-origin";
import { SHORT_CODE_PATTERN, validateTargetUrl } from "@/lib/url";

export const runtime = "nodejs";

function errorResponse(status: 404 | 503) {
  const message = status === 404
    ? "Link tidak ditemukan. Periksa alamatnya atau minta link baru kepada pengirim."
    : "Link belum bisa dibuka. Layanan sedang tidak tersedia; coba lagi nanti.";

  return new Response(`${message}\n\nBuat link: /`, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;

  if (!SHORT_CODE_PATTERN.test(code)) return errorResponse(404);

  try {
    const destination = await findLink(code);

    if (!destination) return errorResponse(404);

    // Revalidate stored data so an invalid database row cannot become a redirect.
    const targetUrl = validateTargetUrl(destination, getRequestOrigin(request));

    return new Response(null, {
      status: 302,
      headers: { Location: targetUrl, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    });
  } catch {
    return errorResponse(503);
  }
}

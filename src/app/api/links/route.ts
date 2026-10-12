import { InputError } from "@/lib/errors";
import { createLink } from "@/lib/links";
import { checkRateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/request-json";
import { getRequestOrigin } from "@/lib/request-origin";
import { validateTargetUrl } from "@/lib/url";

export const runtime = "nodejs";

function json(body: unknown, status: number, headers?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  const callerOrigin = request.headers.get("origin");

  if (callerOrigin && callerOrigin !== origin) {
    return json({ error: "Permintaan harus berasal dari aplikasi ini." }, 403);
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return json({ error: "Kirim data dengan Content-Type application/json." }, 415);
  }

  try {
    const body = await readJson(request);

    if (!body || typeof body !== "object" || !("url" in body)) {
      throw new InputError("Masukkan URL yang ingin dipendekkan.");
    }

    const targetUrl = validateTargetUrl(body.url, origin);
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const retryAfter = checkRateLimit(clientIp);

    if (retryAfter) {
      return json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.` },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    return json(await createLink(targetUrl), 201);
  } catch (error) {
    if (error instanceof InputError) {
      return json({ error: error.message }, 400);
    }

    return json({ error: "Link belum bisa dibuat. Layanan sedang tidak tersedia; coba lagi nanti." }, 503);
  }
}

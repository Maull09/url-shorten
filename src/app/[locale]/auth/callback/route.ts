import { NextResponse } from "next/server";
import { isLocale } from "@/i18n/config";
import { createRouteAuth } from "@/lib/auth/route";
import { getAppOrigin } from "@/lib/auth/config";

export async function GET(request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new NextResponse(null, { status: 404 });
  let auth: ReturnType<typeof createRouteAuth> | undefined;
  try {
    const origin = getAppOrigin();
    const code = new URL(request.url).searchParams.get("code");
    auth = createRouteAuth(request);
    if (code && code.length <= 2048) {
      const { error } = await auth.client.auth.exchangeCodeForSession(code);
      if (!error) return auth.finish(NextResponse.redirect(`${origin}/${locale}/dashboard`));
    }
    return auth.finish(NextResponse.redirect(`${origin}/${locale}/login?notice=confirmationFailed`));
  } catch {
    // A relative, fixed destination remains safe even when config is incomplete.
    const response = new NextResponse(null, { status: 303, headers: { Location: `/${locale}/login?notice=confirmationFailed`, "Cache-Control": "private, no-store" } });
    return auth ? auth.finish(response) : response;
  }
}

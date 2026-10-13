import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient, getVerifiedUser, hasSessionCookie } from "@/lib/auth/client";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (!hasSessionCookie(request.cookies.getAll())) return response;

  try {
    const client = createAuthClient({
      getAll: () => request.cookies.getAll(),
      setAll: (cookies, headers) => {
        const previousCookies = response.cookies.getAll();
        for (const { name, value } of cookies) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const cookie of previousCookies) response.cookies.set(cookie);
        for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
        response.headers.set("Cache-Control", "private, no-store");
      },
    });
    await getVerifiedUser(client);
  } catch {
    // Pages and APIs still verify identity and return a controlled error.
  }
  return response;
}

export const config = { matcher: ["/id/dashboard/:path*", "/en/dashboard/:path*", "/api/dashboard/:path*"] };

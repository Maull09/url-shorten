import { createRouteAuth } from "@/lib/auth/route";
import { authFailure, limitMutation, mutationGuard, privateJson, requestLocale } from "@/lib/auth/http";
import { ServiceError } from "@/lib/errors";

export async function POST(request: Request) {
  const locale = requestLocale(request);
  let auth: ReturnType<typeof createRouteAuth> | undefined;
  try {
    mutationGuard(request);
    const limited = limitMutation(request, "logout", locale);
    if (limited) return limited;
    auth = createRouteAuth(request);
    const { error } = await auth.client.auth.signOut({ scope: "local" });
    if (error) throw new ServiceError("Could not sign out.");
    return auth.finish(privateJson({ status: "signedOut" }, 200, locale));
  } catch (error) {
    const response = authFailure(error, locale);
    return auth ? auth.finish(response) : response;
  }
}

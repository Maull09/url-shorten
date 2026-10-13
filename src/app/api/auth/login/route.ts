import { createRouteAuth } from "@/lib/auth/route";
import { authFailure, authProviderFailure, limitMutation, mutationGuard, privateJson, readPrivateJson, requestLocale } from "@/lib/auth/http";
import { validateCredentials } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const locale = requestLocale(request);
  let auth: ReturnType<typeof createRouteAuth> | undefined;
  try {
    mutationGuard(request);
    const limited = limitMutation(request, "login", locale);
    if (limited) return limited;
    const credentials = validateCredentials(await readPrivateJson(request), "login");
    auth = createRouteAuth(request);
    const { error } = await auth.client.auth.signInWithPassword(credentials);
    if (error) return auth.finish(authProviderFailure(error, locale, "login"));
    return auth.finish(privateJson({ status: "signedIn" }, 200, locale));
  } catch (error) {
    const response = authFailure(error, locale);
    return auth ? auth.finish(response) : response;
  }
}

import { createRouteAuth } from "@/lib/auth/route";
import { getAppOrigin } from "@/lib/auth/config";
import { authFailure, authProviderFailure, limitMutation, mutationGuard, privateJson, readPrivateJson, requestLocale } from "@/lib/auth/http";
import { validateCredentials } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const locale = requestLocale(request);
  let auth: ReturnType<typeof createRouteAuth> | undefined;
  try {
    mutationGuard(request);
    const limited = limitMutation(request, "register", locale);
    if (limited) return limited;
    const credentials = validateCredentials(await readPrivateJson(request), "register");
    auth = createRouteAuth(request);
    const { data, error } = await auth.client.auth.signUp({
      ...credentials,
      options: { emailRedirectTo: `${getAppOrigin()}/${locale}/auth/callback` },
    });
    if (error && error.code !== "user_already_exists") return auth.finish(authProviderFailure(error, locale, "register"));
    return auth.finish(privateJson({ status: data.session ? "signedIn" : "checkEmail" }, 200, locale));
  } catch (error) {
    const response = authFailure(error, locale);
    return auth ? auth.finish(response) : response;
  }
}

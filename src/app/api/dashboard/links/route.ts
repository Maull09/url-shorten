import { requireRouteUser } from "@/lib/auth/route";
import { authFailure, limitMutation, mutationGuard, privateJson, readPrivateJson, requestLocale } from "@/lib/auth/http";
import { AuthRequiredError, InputError } from "@/lib/errors";
import { insertLink } from "@/lib/links";
import { listOwnedLinks, parsePage } from "@/lib/owned-links";
import { validateCustomAlias, validateTargetUrl } from "@/lib/url";
import { getAppOrigin } from "@/lib/auth/config";

export async function GET(request: Request) {
  const locale = requestLocale(request);
  let auth: Awaited<ReturnType<typeof requireRouteUser>> | undefined;
  try {
    auth = await requireRouteUser(request);
    if (!auth.user) throw new AuthRequiredError();
    const page = parsePage(new URL(request.url).searchParams.get("page"));
    const result = await listOwnedLinks(auth.client, auth.user.id, page);
    return auth.finish(privateJson(result, 200, locale));
  } catch (error) {
    const response = authFailure(error, locale);
    return auth ? auth.finish(response) : response;
  }
}

export async function POST(request: Request) {
  const locale = requestLocale(request);
  let auth: Awaited<ReturnType<typeof requireRouteUser>> | undefined;
  try {
    auth = await requireRouteUser(request);
    if (!auth.user) throw new AuthRequiredError();
    mutationGuard(request);
    const limited = limitMutation(request, "owned-create", locale);
    if (limited) return auth.finish(limited);
    const body = await readPrivateJson(request);
    if (!body || typeof body !== "object" || !("url" in body)) throw new InputError("required");
    const targetUrl = validateTargetUrl(body.url, getAppOrigin());
    const alias = validateCustomAlias("alias" in body ? body.alias : undefined);
    const link = await insertLink(auth.client, targetUrl, auth.user.id, alias);
    return auth.finish(privateJson(link, 201, locale));
  } catch (error) {
    const response = authFailure(error, locale);
    return auth ? auth.finish(response) : response;
  }
}

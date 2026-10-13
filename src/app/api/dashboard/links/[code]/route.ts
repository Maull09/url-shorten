import { requireRouteUser } from "@/lib/auth/route";
import { authFailure, limitMutation, mutationGuard, privateJson, requestLocale } from "@/lib/auth/http";
import { AuthRequiredError, InputError } from "@/lib/errors";
import { deleteOwnedLink } from "@/lib/owned-links";
import { SHORT_CODE_PATTERN } from "@/lib/url";
import { getMessages } from "@/i18n/messages";

export async function DELETE(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const locale = requestLocale(request);
  let auth: Awaited<ReturnType<typeof requireRouteUser>> | undefined;
  try {
    auth = await requireRouteUser(request);
    if (!auth.user) throw new AuthRequiredError();
    mutationGuard(request);
    const limited = limitMutation(request, "owned-delete", locale);
    if (limited) return auth.finish(limited);
    const { code } = await params;
    if (!SHORT_CODE_PATTERN.test(code)) throw new InputError("linkMissing");
    const deleted = await deleteOwnedLink(auth.client, auth.user.id, code);
    if (!deleted) return auth.finish(privateJson({ error: getMessages(locale).errors.linkMissing }, 404, locale));
    return auth.finish(privateJson({ deleted: true }, 200, locale));
  } catch (error) {
    const response = authFailure(error, locale);
    return auth ? auth.finish(response) : response;
  }
}

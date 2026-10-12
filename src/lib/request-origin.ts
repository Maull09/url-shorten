export function getRequestOrigin(request: Request): string {
  const internalUrl = new URL(request.url);
  const host = request.headers.get("host") ?? internalUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? `${forwardedProtocol}:`
    : internalUrl.protocol;

  // Next.js can use its internal listening address in request.url.
  return new URL(`${protocol}//${host}`).origin;
}

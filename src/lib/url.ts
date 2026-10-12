import { InputError } from "./errors";

export const MAX_URL_LENGTH = 2048;
export const SHORT_CODE_PATTERN = /^[A-Za-z0-9]{8}$/;

export function validateTargetUrl(input: unknown, origin: string): string {
  if (typeof input !== "string" || !input.trim()) {
    throw new InputError("required");
  }

  const value = input.trim();

  if (value.length > MAX_URL_LENGTH) {
    throw new InputError("tooLong");
  }

  if (!/^https?:\/\//i.test(value)) {
    throw new InputError("protocol");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new InputError("invalidUrl");
  }

  if (!url.hostname || url.username || url.password) {
    throw new InputError("credentials");
  }

  if (url.origin === origin && url.pathname.startsWith("/s/")) {
    throw new InputError("shortLink");
  }

  if (url.href.length > MAX_URL_LENGTH) {
    throw new InputError("normalizedTooLong");
  }

  return url.href;
}

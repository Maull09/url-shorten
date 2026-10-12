import { InputError } from "./errors";

export const MAX_URL_LENGTH = 2048;
export const SHORT_CODE_PATTERN = /^[A-Za-z0-9]{8}$/;

export function validateTargetUrl(input: unknown, origin: string): string {
  if (typeof input !== "string" || !input.trim()) {
    throw new InputError("Masukkan URL yang ingin dipendekkan.");
  }

  const value = input.trim();

  if (value.length > MAX_URL_LENGTH) {
    throw new InputError("URL maksimal 2.048 karakter.");
  }

  if (!/^https?:\/\//i.test(value)) {
    throw new InputError("Gunakan URL lengkap yang diawali https:// atau http://.");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new InputError("URL belum valid. Periksa alamatnya lalu coba lagi.");
  }

  if (!url.hostname || url.username || url.password) {
    throw new InputError("Gunakan URL tanpa username atau password di alamatnya.");
  }

  if (url.origin === origin && url.pathname.startsWith("/s/")) {
    throw new InputError("Masukkan URL tujuan asli, bukan link pendek dari aplikasi ini.");
  }

  if (url.href.length > MAX_URL_LENGTH) {
    throw new InputError("URL setelah normalisasi melebihi 2.048 karakter.");
  }

  return url.href;
}

import { InputError } from "./errors";

const MAX_BODY_BYTES = 8192;

export async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();

  if (!reader) throw new InputError("Masukkan URL yang ingin dipendekkan.");

  const chunks: Uint8Array[] = [];
  let bytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytes += value.byteLength;

      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new InputError("Data terlalu besar. URL maksimal 2.048 karakter.");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(body);
  } catch {
    throw new InputError("Data belum valid. Kirim URL dalam format JSON.");
  }
}

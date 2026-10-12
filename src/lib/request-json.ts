import { InputError } from "./errors";

const MAX_BODY_BYTES = 8192;

export async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();

  if (!reader) throw new InputError("required");

  const chunks: Uint8Array[] = [];
  let bytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytes += value.byteLength;

      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new InputError("bodyTooLarge");
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
    throw new InputError("invalidJson");
  }
}

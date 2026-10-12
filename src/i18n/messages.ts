import id from "./messages/id.json";
import en from "./messages/en.json";
import type { Locale } from "./config";

export type Messages = typeof id;
export type ErrorCode = keyof Messages["errors"];

const messages: Record<Locale, Messages> = { id, en };

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

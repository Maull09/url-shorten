import type { ErrorCode } from "@/i18n/messages";

export class InputError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
  }
}

export class ServiceError extends Error {}

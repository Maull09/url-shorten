"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/messages";

export function CopyButton({ url, messages }: { url: string; messages: Messages["result"] }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <button type="button" onClick={copy} className="min-h-11 rounded-lg border border-control bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent">
        {status === "copied" ? messages.copied : messages.copy}
      </button>
      <span className={status === "error" ? "mt-2 block text-sm text-red-800" : "sr-only"} role="status">
        {status === "copied" && messages.copySuccess}
        {status === "error" && messages.copyFailure}
      </span>
    </div>
  );
}

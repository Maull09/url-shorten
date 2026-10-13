"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

export function DeleteLinkButton({ code, locale, messages }: { code: string; locale: Locale; messages: Messages }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const submitting = useRef(false);
  async function remove() {
    if (submitting.current || !window.confirm(messages.dashboard.deleteConfirm.replace("{code}", code))) return;
    submitting.current = true;
    setPending(true);
    setFeedback("");
    setFailed(false);
    try {
      const response = await fetch(`/api/dashboard/links/${code}`, { method: "DELETE", headers: { "Accept-Language": locale } });
      const body = await response.json();
      if (!response.ok) { setFailed(true); setFeedback(body.error ?? messages.errors.deleteFailed); return; }
      setFeedback(messages.dashboard.deleted);
      router.refresh();
    } catch { setFailed(true); setFeedback(messages.errors.connection); }
    finally { submitting.current = false; setPending(false); }
  }
  return <div><button type="button" onClick={remove} disabled={pending} aria-label={messages.dashboard.deleteLabel.replace("{code}", code)} className="min-h-11 rounded-lg border border-control bg-white px-3 text-sm font-semibold text-red-800 transition-colors hover:border-red-800 hover:bg-red-50 disabled:opacity-70">{pending ? messages.dashboard.deleting : messages.dashboard.delete}</button>{feedback && <p role={failed ? "alert" : "status"} className={`mt-2 max-w-xs text-sm ${failed ? "text-red-800" : "text-green-800"}`}>{feedback}</p>}</div>;
}

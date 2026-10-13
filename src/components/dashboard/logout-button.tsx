"use client";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

export function LogoutButton({ locale, messages }: { locale: Locale; messages: Messages }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  async function logout() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", headers: { "Accept-Language": locale } });
      if (!response.ok) { const body = await response.json(); setError(body.error ?? messages.errors.authUnavailable); return; }
      // A full navigation also discards personalized Next.js router cache.
      window.location.assign(new URL(`/${locale}`, window.location.origin).href);
    } catch { setError(messages.errors.connection); }
    finally { submitting.current = false; setPending(false); }
  }
  return <div><button type="button" onClick={logout} disabled={pending} className="min-h-11 rounded-lg border border-control px-4 text-sm font-semibold hover:text-accent disabled:opacity-70">{pending ? messages.dashboard.loggingOut : messages.dashboard.logout}</button>{error && <p role="alert" className="mt-2 max-w-xs text-sm text-red-800">{error}</p>}</div>;
}

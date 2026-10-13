"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { InputError } from "@/lib/errors";
import { validateCredentials } from "@/lib/auth/validation";

export function AuthForm({ locale, messages, mode, confirmationFailed = false }: { locale: Locale; messages: Messages; mode: "login" | "register"; confirmationFailed?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(confirmationFailed ? messages.auth.confirmationFailed : "");
  const [checkEmail, setCheckEmail] = useState(false);
  const submitting = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const registering = mode === "register";
  const submitLabel = registering ? messages.auth.register : messages.auth.login;
  const pendingLabel = registering ? messages.auth.registering : messages.auth.loggingIn;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    setCheckEmail(false);
    let credentials: ReturnType<typeof validateCredentials>;
    try {
      credentials = validateCredentials({ email, password }, mode);
    } catch (error) {
      setError(error instanceof InputError ? messages.errors[error.code] : messages.errors.authFields);
      if (error instanceof InputError && error.code === "authPassword") passwordRef.current?.focus();
      else emailRef.current?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json", "Accept-Language": locale }, body: JSON.stringify(credentials) });
      const data: { error?: string; status?: string } = await response.json();
      if (!response.ok) { setError(data.error ?? messages.errors.authUnavailable); return; }
      setPassword("");
      if (data.status === "checkEmail") { setCheckEmail(true); return; }
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch {
      setError(messages.errors.connection);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-white p-6 sm:p-8" aria-labelledby="auth-heading">
      <h1 id="auth-heading" className="font-display text-3xl leading-tight font-bold tracking-tight">{registering ? messages.auth.registerTitle : messages.auth.loginTitle}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">{registering ? messages.auth.registerDescription : messages.auth.loginDescription}</p>
      <form onSubmit={submit} noValidate aria-busy={pending} className="mt-7 space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">{messages.auth.email}</label>
          <input ref={emailRef} id="email" name="email" type="email" required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} disabled={pending}
            onChange={(event) => setEmail(event.target.value)} className="min-h-13 w-full rounded-lg border border-control bg-canvas px-4 disabled:opacity-70" />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold">{messages.auth.password}</label>
          <input ref={passwordRef} id="password" name="password" type={visible ? "text" : "password"} required maxLength={128} minLength={registering ? 8 : undefined} autoComplete={registering ? "new-password" : "current-password"} value={password} disabled={pending}
            aria-describedby={registering ? "password-help" : undefined} onChange={(event) => setPassword(event.target.value)} className="min-h-13 w-full rounded-lg border border-control bg-canvas px-4 disabled:opacity-70" />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            {registering && <p id="password-help" className="text-sm text-muted">{messages.auth.passwordHelp}</p>}
            <button type="button" onClick={() => setVisible((value) => !value)} aria-pressed={visible} className="min-h-11 text-sm font-semibold text-accent">{visible ? messages.auth.hidePassword : messages.auth.showPassword}</button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {checkEmail && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{messages.auth.checkEmail}</p>}
        <button type="submit" disabled={pending} className="min-h-13 w-full rounded-lg bg-accent px-5 font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70">
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">{registering ? messages.auth.hasAccount : messages.auth.noAccount}{" "}<Link href={`/${locale}/${registering ? "login" : "register"}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4">{registering ? messages.auth.login : messages.auth.register}</Link></p>
    </section>
  );
}

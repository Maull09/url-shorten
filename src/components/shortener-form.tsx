"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { InputError } from "@/lib/errors";
import { MAX_ALIAS_LENGTH, MAX_URL_LENGTH, validateCustomAlias, validateTargetUrl } from "@/lib/url";
import type { CreatedLink } from "@/lib/links";
import { SessionLinkList, type ShortLink } from "./session-link-list";

export function ShortenerForm({ locale, messages, endpoint = "/api/links", onCreated }: { locale: Locale; messages: Messages; endpoint?: "/api/links" | "/api/dashboard/links"; onCreated?: () => void }) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [aliasError, setAliasError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const submitting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pending) return;
    if (fieldError) inputRef.current?.focus();
    else if (aliasError) aliasRef.current?.focus();
  }, [fieldError, aliasError, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    setFieldError("");
    setAliasError("");
    setServiceError("");
    setSaved(false);

    let targetUrl: string;

    try {
      targetUrl = validateTargetUrl(url, window.location.origin);
    } catch (error) {
      setFieldError(error instanceof InputError ? messages.errors[error.code] : messages.errors.invalidUrl);
      inputRef.current?.focus();
      return;
    }

    let customAlias: string | undefined;
    try {
      customAlias = validateCustomAlias(alias);
    } catch {
      setAliasError(messages.errors.aliasInvalid);
      aliasRef.current?.focus();
      return;
    }

    submitting.current = true;
    setPending(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": locale },
        body: JSON.stringify({ url: targetUrl, alias: customAlias }),
      });
      const data: CreatedLink & { error?: string; field?: string } = await response.json();

      if (!response.ok) {
        const message = data.error ?? messages.errors.unavailable;
        if (data.field === "alias") setAliasError(message);
        else if (response.status === 400) setFieldError(message);
        else setServiceError(message);
        return;
      }

      if (endpoint === "/api/links") {
        const link = { ...data, shortUrl: `${window.location.origin}/s/${data.code}` };
        setLinks((previous) => [link, ...previous].slice(0, 6));
      }
      setSaved(true);
      setAlias("");
      onCreated?.();
    } catch {
      setServiceError(messages.errors.connection);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="min-w-0" id="buat-link">
      <section className="rounded-xl border border-line bg-white p-5 sm:p-6" aria-labelledby="form-heading">
        <h2 id="form-heading" className="mb-5 text-base font-semibold">{messages.form.heading}</h2>
        <form onSubmit={submit} noValidate aria-busy={pending} className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)_auto]">
          <div className="min-w-0">
            <label htmlFor="url" className="mb-2 block text-sm font-semibold">{messages.form.label}</label>
            <input ref={inputRef} id="url" name="url" type="url" required maxLength={MAX_URL_LENGTH} value={url} disabled={pending}
              onChange={(event) => { setUrl(event.target.value); setFieldError(""); setServiceError(""); }}
              placeholder={messages.form.placeholder}
              autoComplete="url" autoCapitalize="none" spellCheck={false}
              aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? "url-help url-error" : "url-help"}
              className="min-h-11 w-full min-w-0 rounded-lg border border-control bg-white px-3 text-base text-ink placeholder:text-slate-500 focus:border-accent disabled:opacity-70" />
            <p id="url-help" className="mt-2 text-sm text-muted">{messages.form.help}</p>
            {fieldError && <p id="url-error" role="alert" className="mt-3 text-sm text-red-800">{fieldError}</p>}
          </div>
          <div className="min-w-0">
            <label htmlFor="alias" className="mb-2 block text-sm font-semibold">{messages.alias.label}</label>
            <div className="flex min-h-11 min-w-0 rounded-lg border border-control bg-white focus-within:border-accent">
              <span aria-hidden="true" className="flex shrink-0 items-center border-r border-line px-3 font-mono text-sm text-muted">/s/</span>
              <input ref={aliasRef} id="alias" name="alias" type="text" maxLength={MAX_ALIAS_LENGTH} value={alias} disabled={pending}
                onChange={(event) => { setAlias(event.target.value); setAliasError(""); setServiceError(""); }}
                placeholder={messages.alias.placeholder} autoComplete="off" autoCapitalize="none" spellCheck={false}
                aria-invalid={Boolean(aliasError)} aria-describedby={aliasError ? "alias-help alias-error" : "alias-help"}
                className="w-full min-w-0 rounded-r-lg bg-transparent px-3 font-mono text-base text-ink placeholder:text-slate-500 disabled:opacity-70" />
            </div>
            <p id="alias-help" className="mt-2 text-sm text-muted">{messages.alias.help}</p>
            {aliasError && <p id="alias-error" role="alert" className="mt-3 text-sm text-red-800">{aliasError}</p>}
          </div>
          <button disabled={pending} type="submit" className="flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70 md:mt-7">
            {pending ? messages.form.pending : messages.form.submit}
          </button>
          {serviceError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-3">{serviceError}</p>}
        </form>
        {saved && <p role="status" className="mt-4 text-sm font-semibold text-green-800">{endpoint === "/api/dashboard/links" ? messages.dashboard.createdSuccess : messages.result.ready}</p>}
      </section>
      {endpoint === "/api/links" && <SessionLinkList links={links} messages={messages} />}
    </div>
  );
}

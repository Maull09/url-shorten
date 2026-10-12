"use client";

import { useRef, useState, type FormEvent } from "react";
import { InputError } from "@/lib/errors";
import { MAX_URL_LENGTH, validateTargetUrl } from "@/lib/url";
import type { CreatedLink } from "@/lib/links";
import { CopyButton } from "./copy-button";
import { LinkIcon } from "./link-icon";
import { LinkResult, type ShortLink } from "./link-result";

export function ShortenerForm() {
  const [url, setUrl] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [pending, setPending] = useState(false);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const submitting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    setFieldError("");
    setServiceError("");

    let targetUrl: string;

    try {
      targetUrl = validateTargetUrl(url, window.location.origin);
    } catch (error) {
      setFieldError(error instanceof InputError ? error.message : "Periksa URL yang dimasukkan.");
      inputRef.current?.focus();
      return;
    }

    submitting.current = true;
    setPending(true);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data: CreatedLink & { error?: string } = await response.json();

      if (!response.ok) {
        const message = data.error ?? "Link belum bisa dibuat. Coba lagi nanti.";
        if (response.status === 400) setFieldError(message);
        else setServiceError(message);
        return;
      }

      const link = { ...data, shortUrl: `${window.location.origin}/s/${data.code}` };
      setLinks((previous) => [link, ...previous].slice(0, 6));
    } catch {
      setServiceError("Koneksi terputus. Periksa koneksi lalu coba lagi.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="min-w-0" id="buat-link">
      <section className="rounded-xl border border-line bg-white p-6 sm:p-8" aria-labelledby="form-heading">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-accent"><LinkIcon /></span>
          <h2 id="form-heading" className="text-xl font-semibold tracking-tight">Buat link pendek</h2>
        </div>
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <label htmlFor="url" className="mb-2 block text-sm font-semibold">URL tujuan</label>
          <input ref={inputRef} id="url" name="url" type="url" required maxLength={MAX_URL_LENGTH} value={url} disabled={pending}
            onChange={(event) => { setUrl(event.target.value); setFieldError(""); setServiceError(""); }}
            placeholder="https://contoh.com/link-panjang"
            autoComplete="url" autoCapitalize="none" spellCheck={false}
            aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? "url-help url-error" : "url-help"}
            className="min-h-13 w-full min-w-0 rounded-lg border border-control bg-canvas px-4 text-base text-ink placeholder:text-slate-500 focus:border-accent disabled:opacity-70" />
          <p id="url-help" className="mt-2 text-sm text-muted">Gunakan alamat lengkap dengan https:// atau http://.</p>
          {fieldError && <p id="url-error" role="alert" className="mt-3 text-sm text-red-800">{fieldError}</p>}
          <button disabled={pending} type="submit" className="mt-6 flex min-h-13 w-full items-center justify-center gap-3 rounded-lg bg-accent px-5 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70">
            {pending ? "Membuat link…" : "Pendekkan link"}
            {!pending && <span aria-hidden="true">↗</span>}
          </button>
          {serviceError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{serviceError}</p>}
        </form>
        {links[0] && <LinkResult link={links[0]} />}
        {!links.length && <p className="mt-6 text-center text-sm text-muted">Link pendekmu akan muncul di sini.</p>}
      </section>
      {links.length > 1 && (
        <section className="mt-7" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-base font-semibold">Link sebelumnya</h2>
          <p className="mt-1 text-sm text-muted">Dibuat selama halaman ini terbuka.</p>
          <ul className="mt-3 divide-y divide-line">
            {links.slice(1).map((link) => (
              <li key={link.code} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-sm font-semibold text-accent underline underline-offset-4">/s/{link.code}<span className="sr-only"> di tab baru</span></a>
                  <p className="mt-1 truncate text-sm text-muted" title={link.targetUrl}>{link.targetUrl}</p>
                </div>
                <CopyButton url={link.shortUrl} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

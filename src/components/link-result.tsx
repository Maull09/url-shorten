import type { CreatedLink } from "@/lib/links";
import { CopyButton } from "./copy-button";

export type ShortLink = CreatedLink & { shortUrl: string };

export function LinkResult({ link }: { link: ShortLink }) {
  return (
    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
      <p className="mb-3 text-sm font-semibold text-green-800" role="status">Link pendek siap dibagikan.</p>
      <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="block break-all font-mono text-lg font-bold text-accent underline decoration-blue-300 underline-offset-4">
        {link.shortUrl}
      </a>
      <p className="mt-3 break-all text-sm text-muted">Tujuan: {link.targetUrl}</p>
      <div className="mt-5 flex flex-wrap items-start gap-3">
        <CopyButton key={link.code} url={link.shortUrl} />
        <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-accent underline-offset-4 hover:underline">Buka link<span className="sr-only"> di tab baru</span></a>
      </div>
    </div>
  );
}

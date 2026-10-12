import type { CreatedLink } from "@/lib/links";
import type { Messages } from "@/i18n/messages";
import { CopyButton } from "./copy-button";

export type ShortLink = CreatedLink & { shortUrl: string };

export function LinkResult({ link, messages }: { link: ShortLink; messages: Messages["result"] }) {
  return (
    <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
      <p className="mb-3 text-sm font-semibold text-green-800" role="status">{messages.ready}</p>
      <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="block break-all font-mono text-lg font-bold text-accent underline decoration-blue-300 underline-offset-4">
        {link.shortUrl}<span className="sr-only"> {messages.newTab}</span>
      </a>
      <p className="mt-3 break-all text-sm text-muted">{messages.destination}: {link.targetUrl}</p>
      <div className="mt-5 flex flex-wrap items-start gap-3">
        <CopyButton key={link.code} url={link.shortUrl} messages={messages} />
        <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-accent underline-offset-4 hover:underline">{messages.open}<span className="sr-only"> {messages.newTab}</span></a>
      </div>
    </div>
  );
}

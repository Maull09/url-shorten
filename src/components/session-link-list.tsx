import type { CreatedLink } from "@/lib/links";
import type { Messages } from "@/i18n/messages";
import { CopyButton } from "./copy-button";

export type ShortLink = CreatedLink & { shortUrl: string };

export function SessionLinkList({ links, messages }: { links: ShortLink[]; messages: Messages }) {
  return (
    <section className="mt-8" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="text-base font-semibold">{messages.workspace.sessionTitle}</h2>
      <p className="mt-1 border-b border-line pb-3 text-sm text-muted">{messages.workspace.sessionHelp}</p>
      {!links.length && <p className="py-8 text-sm text-muted">{messages.form.empty}</p>}
      <ul className="divide-y divide-line">
        {links.map((link) => (
          <li key={link.code} className="grid items-center gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
            <div className="min-w-0">
              <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center break-all font-mono text-sm font-semibold text-accent underline underline-offset-4">/s/{link.code}<span className="sr-only"> {messages.result.newTab}</span></a>
              <p className="break-all text-sm text-muted">{link.targetUrl}</p>
            </div>
            <CopyButton url={link.shortUrl} messages={messages.result} />
          </li>
        ))}
      </ul>
    </section>
  );
}

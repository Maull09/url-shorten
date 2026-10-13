import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import type { CreatedLink } from "@/lib/links";
import { PAGE_SIZE } from "@/lib/owned-links";
import { CopyButton } from "../copy-button";
import { DeleteLinkButton } from "./delete-link-button";

export function DashboardLinkList({ links, total, page, origin, locale, messages }: { links: CreatedLink[]; total: number; page: number; origin: string; locale: Locale; messages: Messages }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const numbers = new Intl.NumberFormat(locale);
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Jakarta" });
  return (
    <section className="min-w-0" aria-labelledby="links-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-5">
        <h2 id="links-heading" className="text-xl font-semibold tracking-tight">{messages.dashboard.listTitle}</h2>
        <p className="text-sm text-muted">{messages.dashboard.count}: <span className="font-semibold text-ink">{numbers.format(total)}</span></p>
      </div>
      {!links.length && <p className="py-8 leading-relaxed text-muted">{messages.dashboard.empty}</p>}
      <ul className="divide-y divide-line">
        {links.map((link) => {
          const shortUrl = `${origin}/s/${link.code}`;
          return (
            <li key={link.code} className="py-6">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-lg font-semibold text-accent underline underline-offset-4">/s/{link.code}<span className="sr-only"> {messages.result.newTab}</span></a>
              <p className="mt-3 break-all text-sm text-muted">{link.targetUrl}</p>
              <p className="mt-2 text-xs text-muted">{messages.dashboard.created}: <time dateTime={link.createdAt}>{dates.format(new Date(link.createdAt))}</time></p>
              <div className="mt-4 flex flex-wrap items-start gap-3"><CopyButton url={shortUrl} messages={messages.result} /><DeleteLinkButton code={link.code} locale={locale} messages={messages} /></div>
            </li>
          );
        })}
      </ul>
      {pages > 1 && (
        <nav aria-label={messages.dashboard.page.replace("{page}", numbers.format(page)).replace("{pages}", numbers.format(pages))} className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm">
          {page > 1 ? <Link href={`/${locale}/dashboard?page=${page - 1}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline">{messages.dashboard.previous}</Link> : <span aria-disabled="true" className="text-muted">{messages.dashboard.previous}</span>}
          <p>{messages.dashboard.page.replace("{page}", numbers.format(page)).replace("{pages}", numbers.format(pages))}</p>
          {page < pages ? <Link href={`/${locale}/dashboard?page=${page + 1}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline">{messages.dashboard.next}</Link> : <span aria-disabled="true" className="text-muted">{messages.dashboard.next}</span>}
        </nav>
      )}
    </section>
  );
}

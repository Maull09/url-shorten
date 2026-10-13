import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { PAGE_SIZE, type OwnedLink } from "@/lib/owned-links";
import { CopyButton } from "../copy-button";
import { DeleteLinkButton } from "./delete-link-button";

export function DashboardLinkList({ links, total, totalVisits, page, origin, locale, messages }: { links: OwnedLink[]; total: number; totalVisits: number; page: number; origin: string; locale: Locale; messages: Messages }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const numbers = new Intl.NumberFormat(locale);
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Jakarta" });
  return (
    <section className="min-w-0" aria-labelledby="links-heading">
      <div className="border-b border-line pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="links-heading" className="text-base font-semibold">{messages.dashboard.listTitle}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <p>{messages.dashboard.count}: <span className="font-semibold text-ink">{numbers.format(total)}</span></p>
            <p>{messages.dashboard.totalVisits}: <span className="font-semibold text-ink">{numbers.format(totalVisits)}</span></p>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted">{messages.dashboard.visitsHelp}</p>
      </div>
      {!links.length && <p className="py-8 leading-relaxed text-muted">{messages.dashboard.empty}</p>}
      <ul className="divide-y divide-line">
        {links.map((link) => {
          const shortUrl = `${origin}/s/${link.code}`;
          return (
            <li key={link.code} className="grid items-center gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
              <div className="min-w-0">
                <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full min-h-11 items-center break-all font-mono text-sm font-semibold text-accent underline underline-offset-4">{shortUrl}<span className="sr-only"> {messages.result.newTab}</span></a>
                <p className="break-all text-sm text-muted">{link.targetUrl}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted">
                  <p>{messages.dashboard.created}: <time dateTime={link.createdAt}>{dates.format(new Date(link.createdAt))}</time></p>
                  <p>{messages.dashboard.visits}: <span className="font-semibold text-ink">{numbers.format(link.visitCount)}</span></p>
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-2"><CopyButton url={shortUrl} messages={messages.result} /><DeleteLinkButton code={link.code} locale={locale} messages={messages} /></div>
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

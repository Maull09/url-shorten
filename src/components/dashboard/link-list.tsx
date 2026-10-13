import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { PAGE_SIZE, type OwnedLink } from "@/lib/owned-links";
import { CopyButton } from "../copy-button";
import { LinkIcon } from "../link-icon";
import { DeleteLinkButton } from "./delete-link-button";

export function DashboardLinkList({ links, total, totalVisits, page, origin, locale, messages }: { links: OwnedLink[]; total: number; totalVisits: number; page: number; origin: string; locale: Locale; messages: Messages }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const numbers = new Intl.NumberFormat(locale);
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Jakarta" });
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white" aria-labelledby="links-heading">
      <div className="border-b border-line bg-canvas/70 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="links-heading" className="text-lg font-semibold tracking-tight">{messages.dashboard.listTitle}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <p>{messages.dashboard.count}: <span className="font-semibold text-ink">{numbers.format(total)}</span></p>
            <p>{messages.dashboard.totalVisits}: <span className="font-semibold text-ink">{numbers.format(totalVisits)}</span></p>
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{messages.dashboard.visitsHelp}</p>
      </div>
      {!links.length && <p className="m-4 rounded-lg border border-dashed border-line bg-canvas/50 p-6 text-sm leading-relaxed text-muted sm:m-6">{messages.dashboard.empty}</p>}
      <ul className="divide-y divide-line">
        {links.map((link) => {
          const shortUrl = `${origin}/s/${link.code}`;
          return (
            <li key={link.code} className="grid items-center gap-4 px-4 py-5 transition-colors hover:bg-canvas/70 focus-within:bg-canvas/70 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-accent" aria-hidden="true"><LinkIcon /></span>
                <div className="min-w-0 flex-1">
                  <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full min-h-11 items-center break-all font-mono text-sm font-semibold text-accent underline underline-offset-4">{shortUrl}<span className="sr-only"> {messages.result.newTab}</span></a>
                  <p className="mt-1 break-all text-sm leading-relaxed text-muted"><span className="font-semibold">{messages.result.destination}:</span> {link.targetUrl}</p>
                  <p className="mt-2 text-xs text-muted">{messages.dashboard.created}: <time dateTime={link.createdAt}>{dates.format(new Date(link.createdAt))}</time></p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 sm:justify-end lg:w-84 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
                <div className="flex min-w-0 items-baseline gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-ink lg:w-24 lg:flex-col lg:gap-0">
                  <span className="text-xs text-muted">{messages.dashboard.visits}</span>
                  <span className="min-w-0 break-all text-xl font-semibold tabular-nums">{numbers.format(link.visitCount)}</span>
                </div>
                <div className="flex min-w-0 flex-wrap items-start gap-2 lg:w-48"><CopyButton url={shortUrl} messages={messages.result} /><DeleteLinkButton code={link.code} locale={locale} messages={messages} /></div>
              </div>
            </li>
          );
        })}
      </ul>
      {pages > 1 && (
        <nav aria-label={messages.dashboard.page.replace("{page}", numbers.format(page)).replace("{pages}", numbers.format(pages))} className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/70 px-4 py-4 text-sm sm:px-6">
          {page > 1 ? <Link href={`/${locale}/dashboard?page=${page - 1}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline">{messages.dashboard.previous}</Link> : <span aria-disabled="true" className="text-muted">{messages.dashboard.previous}</span>}
          <p>{messages.dashboard.page.replace("{page}", numbers.format(page)).replace("{pages}", numbers.format(pages))}</p>
          {page < pages ? <Link href={`/${locale}/dashboard?page=${page + 1}`} className="inline-flex min-h-11 items-center font-semibold text-accent underline">{messages.dashboard.next}</Link> : <span aria-disabled="true" className="text-muted">{messages.dashboard.next}</span>}
        </nav>
      )}
    </section>
  );
}

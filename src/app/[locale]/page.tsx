import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LinkIcon } from "@/components/link-icon";
import { ShortenerForm } from "@/components/shortener-form";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <a href="#konten" className="sr-only z-10 rounded-lg bg-white p-3 focus:not-sr-only focus:absolute focus:top-3">{messages.navigation.skip}</a>
      <header className="flex min-h-24 items-center justify-between gap-4 border-b border-line">
        <Link href={`/${locale}`} aria-label={messages.navigation.home} className="flex min-h-11 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white"><LinkIcon className="h-5 w-5" /></span>
          <span className="text-2xl font-bold tracking-tight">pendek.</span>
        </Link>
        <div className="flex items-center gap-6">
          <a href="#cara-kerja" className="hidden min-h-11 items-center text-sm font-semibold text-muted underline-offset-4 hover:text-accent hover:underline sm:inline-flex">{messages.navigation.how}</a>
          <LanguageSwitcher locale={locale} label={messages.navigation.language} />
        </div>
      </header>

      <main id="konten">
        <section className="grid items-start gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24" aria-labelledby="hero-heading">
          <div className="min-w-0">
            <h1 id="hero-heading" className="font-display text-[clamp(2.25rem,11vw,2.75rem)] leading-[1.12] font-bold tracking-[-0.03em] sm:text-[clamp(2.75rem,6vw,4.5rem)]">{messages.hero.firstLine}<br />{messages.hero.secondLine}</h1>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-muted">{messages.hero.description}</p>
            <div className="mt-10 hidden max-w-md lg:block" aria-label={messages.hero.illustration}>
              <div className="rounded-lg border border-line bg-white px-4 py-3">
                <span className="text-xs font-semibold text-muted">{messages.hero.before}</span>
                <p className="mt-1 truncate font-mono text-sm text-muted">{messages.hero.example}</p>
              </div>
              <div className="flex h-9 items-center pl-5 text-accent" aria-hidden="true">↓</div>
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <LinkIcon />
                <div className="min-w-0"><span className="text-xs font-semibold text-muted">{messages.hero.after}</span><p className="mt-1 font-mono text-base font-semibold text-ink">/s/Ab3k9X2m</p></div>
              </div>
            </div>
          </div>
          <ShortenerForm locale={locale} messages={messages} />
        </section>

        <section id="cara-kerja" className="scroll-mt-8 border-t border-line py-10 sm:py-12" aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="text-2xl font-semibold tracking-tight">{messages.how.heading}</h2>
          <ol className="mt-8 grid gap-7 sm:grid-cols-3 sm:gap-9">
            {messages.how.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-muted" aria-hidden="true">{index + 1}</span>
                <div><h3 className="font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p></div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-sm text-muted">
        <p>pendek. <span className="ml-2">{messages.footer.tagline}</span></p>
        <p>{messages.footer.privacy}</p>
      </footer>
    </div>
  );
}

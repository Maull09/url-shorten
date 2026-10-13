import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandLink } from "@/components/brand-link";
import { ShortenerForm } from "@/components/shortener-form";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <a href="#konten" className="sr-only z-10 rounded-lg bg-white p-3 focus:not-sr-only focus:absolute focus:top-3">{messages.navigation.skip}</a>
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-line py-3">
        <BrandLink locale={locale} label={messages.navigation.home} />
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <Link href={`/${locale}/login`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">{messages.auth.login}</Link>
          <Link href={`/${locale}/dashboard`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">{messages.auth.dashboard}</Link>
          <LanguageSwitcher locale={locale} label={messages.navigation.language} />
        </div>
      </header>

      <main id="konten" className="py-8 sm:py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">{messages.workspace.title}</h1>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">{messages.auth.publicNote}{" "}<Link href={`/${locale}/dashboard`} className="font-semibold text-accent underline underline-offset-4">{messages.auth.dashboard}</Link></p>
        <ShortenerForm locale={locale} messages={messages} />
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 text-sm text-muted">
        <p>pendek. <span className="ml-2">{messages.footer.tagline}</span></p>
        <p>{messages.footer.privacy}</p>
      </footer>
    </div>
  );
}

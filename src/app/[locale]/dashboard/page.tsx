import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { getServerAuth } from "@/lib/auth/server";
import { getAppOrigin } from "@/lib/auth/config";
import { listOwnedLinks, PAGE_SIZE, parsePage } from "@/lib/owned-links";
import { BrandLink } from "@/components/brand-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DashboardLinkCreator } from "@/components/dashboard/link-creator";
import { DashboardLinkList } from "@/components/dashboard/link-list";
import { LogoutButton } from "@/components/dashboard/logout-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { title: `${getMessages(locale).auth.dashboard} — Pendek`, robots: { index: false, follow: false } };
}

function Unavailable({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-line py-3">
        <BrandLink locale={locale} label={messages.navigation.home} />
        <LanguageSwitcher locale={locale} label={messages.navigation.language} page="dashboard" />
      </header>
      <main className="py-8 sm:py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">{messages.dashboard.title}</h1>
        <div className="mt-6 rounded-xl border border-line bg-white p-5 sm:p-6">
          <p role="alert" className="text-sm text-muted">{messages.dashboard.unavailable}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <a href={`/${locale}/dashboard`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-white">{messages.dashboard.retry}</a>
            <Link href={`/${locale}`} className="inline-flex min-h-11 items-center text-sm text-accent underline">{messages.auth.home}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default async function DashboardPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  let auth: Awaited<ReturnType<typeof getServerAuth>>;
  try { auth = await getServerAuth(); } catch { return <Unavailable locale={locale} />; }
  if (!auth) redirect(`/${locale}/login`);
  let page: number;
  try { page = parsePage((await searchParams).page); } catch { notFound(); }
  let data: Awaited<ReturnType<typeof listOwnedLinks>>;
  try { data = await listOwnedLinks(auth.client, auth.user.id, page); } catch { return <Unavailable locale={locale} />; }
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  if (page > pages) redirect(`/${locale}/dashboard?page=${pages}`);
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <a href="#dashboard-content" className="sr-only z-10 rounded-lg bg-white p-3 focus:not-sr-only focus:absolute focus:top-3">{messages.navigation.skip}</a>
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-line py-3">
        <BrandLink locale={locale} label={messages.navigation.home} />
        <LanguageSwitcher locale={locale} label={messages.navigation.language} page="dashboard" />
      </header>
      <main id="dashboard-content" className="py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0"><h1 className="font-display text-3xl font-bold tracking-tight">{messages.dashboard.title}</h1><p className="mt-2 break-all text-sm text-muted">{messages.dashboard.account}: {auth.user.email}</p></div>
          <LogoutButton locale={locale} messages={messages} />
        </div>
        <div className="space-y-8">
          <DashboardLinkCreator locale={locale} messages={messages} />
          <DashboardLinkList {...data} origin={getAppOrigin()} locale={locale} messages={messages} />
        </div>
      </main>
    </div>
  );
}

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
  return <main className="mx-auto max-w-xl px-6 py-16"><h1 className="font-display text-3xl font-bold">{messages.dashboard.title}</h1><p role="alert" className="mt-5 text-muted">{messages.dashboard.unavailable}</p><a href={`/${locale}/dashboard`} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-white">{messages.dashboard.retry}</a><Link href={`/${locale}`} className="ml-4 inline-flex min-h-11 items-center text-accent underline">{messages.auth.home}</Link></main>;
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
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <a href="#dashboard-content" className="sr-only z-10 rounded-lg bg-white p-3 focus:not-sr-only focus:absolute focus:top-3">{messages.navigation.skip}</a>
      <header className="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-line py-5">
        <BrandLink locale={locale} label={messages.navigation.home} />
        <LanguageSwitcher locale={locale} label={messages.navigation.language} page="dashboard" />
      </header>
      <main id="dashboard-content" className="py-10 sm:py-14">
        <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div><h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{messages.dashboard.title}</h1><p className="mt-4 max-w-lg leading-relaxed text-muted">{messages.dashboard.description}</p></div>
          <div className="min-w-0 max-w-full"><p className="mb-3 break-all text-sm text-muted">{messages.dashboard.account}: {auth.user.email}</p><LogoutButton locale={locale} messages={messages} /></div>
        </div>
        <div className="grid items-start gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
          <DashboardLinkCreator locale={locale} messages={messages} />
          <DashboardLinkList {...data} origin={getAppOrigin()} locale={locale} messages={messages} />
        </div>
      </main>
    </div>
  );
}

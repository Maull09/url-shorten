import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export function NotFoundContent({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">{messages.notFound.title}</h1>
      <p className="mt-4 text-muted">{messages.notFound.description}</p>
      <Link href={`/${locale}`} className="mt-8 inline-flex min-h-11 w-fit items-center rounded-lg bg-accent px-5 font-semibold text-white">{messages.notFound.home}</Link>
    </main>
  );
}

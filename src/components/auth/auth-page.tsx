import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { BrandLink } from "../brand-link";
import { LanguageSwitcher } from "../language-switcher";
import { AuthForm } from "./auth-form";

export function AuthPage({ locale, mode, confirmationFailed = false }: { locale: Locale; mode: "login" | "register"; confirmationFailed?: boolean }) {
  const messages = getMessages(locale);
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="flex min-h-24 items-center justify-between gap-4 border-b border-line">
        <BrandLink locale={locale} label={messages.navigation.home} />
        <LanguageSwitcher locale={locale} label={messages.navigation.language} page={mode} />
      </header>
      <main className="mx-auto max-w-md py-12 sm:py-16">
        <AuthForm locale={locale} messages={messages} mode={mode} confirmationFailed={confirmationFailed} />
        <Link href={`/${locale}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4">{messages.auth.home}</Link>
      </main>
    </div>
  );
}

import Link from "next/link";
import { locales, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

const languageNames = { id: "Bahasa Indonesia", en: "English" };

export function LanguageSwitcher({ locale, label, page = "" }: { locale: Locale; label: Messages["navigation"]["language"]; page?: "" | "login" | "register" | "dashboard" }) {
  return (
    <nav aria-label={label} className="flex items-center gap-1 rounded-lg border border-line p-1">
      {locales.map((language) => (
        <Link key={language} href={`/${language}${page ? `/${page}` : ""}`} hrefLang={language} lang={language}
          aria-label={languageNames[language]} aria-current={locale === language ? "page" : undefined}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-semibold ${locale === language ? "bg-ink text-white" : "text-muted hover:bg-blue-50 hover:text-accent"}`}>
          {language.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

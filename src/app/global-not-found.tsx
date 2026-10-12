import { manrope, lora } from "@/assets/fonts";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotFoundContent } from "@/components/not-found-content";
import { defaultLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import "./globals.css";

export const metadata = { title: "404 — Pendek" };

export default function GlobalNotFound() {
  const messages = getMessages(defaultLocale);

  return (
    <html lang={defaultLocale} className={`${manrope.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        <div className="absolute top-6 right-6"><LanguageSwitcher locale={defaultLocale} label={messages.navigation.language} /></div>
        <NotFoundContent locale={defaultLocale} />
      </body>
    </html>
  );
}

import { notFound } from "next/navigation";
import { AuthPage } from "@/components/auth/auth-page";
import { getMessages } from "@/i18n/messages";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { title: `${getMessages(locale).auth.register} — Pendek`, robots: { index: false, follow: false } };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AuthPage locale={locale} mode="register" />;
}

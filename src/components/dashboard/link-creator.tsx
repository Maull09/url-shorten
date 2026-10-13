"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { ShortenerForm } from "../shortener-form";

export function DashboardLinkCreator({ locale, messages }: { locale: Locale; messages: Messages }) {
  const router = useRouter();
  return <ShortenerForm locale={locale} messages={messages} endpoint="/api/dashboard/links" onCreated={() => router.refresh()} />;
}

"use client";

import { useParams } from "next/navigation";
import { NotFoundContent } from "@/components/not-found-content";
import { defaultLocale, isLocale } from "@/i18n/config";

export default function NotFound() {
  const { locale } = useParams<{ locale: string }>();
  return <NotFoundContent locale={isLocale(locale) ? locale : defaultLocale} />;
}

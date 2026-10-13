import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { LinkIcon } from "./link-icon";

export function BrandLink({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link href={`/${locale}`} aria-label={label} className="flex min-h-11 items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white"><LinkIcon className="h-5 w-5" /></span>
      <span className="text-2xl font-bold tracking-tight">pendek.</span>
    </Link>
  );
}

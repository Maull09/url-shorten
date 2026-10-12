export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function getPreferredLocale(acceptLanguage: string | null): Locale {
  const preferences = (acceptLanguage ?? "").split(",").map((entry) => {
    const [tag, ...parameters] = entry.trim().split(";");
    const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
    const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
    return { language: tag.toLowerCase().split("-")[0], quality };
  }).filter(({ quality }) => quality > 0 && quality <= 1)
    .sort((a, b) => b.quality - a.quality);

  for (const { language } of preferences) {
    if (isLocale(language)) return language;
  }

  return defaultLocale;
}

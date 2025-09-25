export const locales = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "zh",
  "ja",
] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

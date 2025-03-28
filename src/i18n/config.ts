export type Locale = "hu" | "en";

export const defaultLocale: Locale = "hu";

export const locales: { [key in Locale]: string } = {
  hu: "Magyar",
  en: "English",
};

export function getLocaleFromString(locale: string): Locale {
  return locales[locale as Locale] ? (locale as Locale) : defaultLocale;
}

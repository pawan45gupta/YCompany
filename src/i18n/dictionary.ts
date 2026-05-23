import en from "./en.json";

export type Dictionary = typeof en;

export const defaultLocale = "en" as const;
export type Locale = typeof defaultLocale;

const dictionaries: Record<Locale, Dictionary> = { en };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

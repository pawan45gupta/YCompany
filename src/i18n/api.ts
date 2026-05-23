import { getTranslations } from "./server";

/** Server-side API error messages from en.json */
export function apiMessage(key: string): string {
  const { t } = getTranslations();
  return t(`api.${key}`);
}

import { getDictionary } from "./dictionary";
import { translate } from "./translate";

export { getDictionary };
export type { Dictionary, Locale } from "./dictionary";

export function getTranslations(locale?: Parameters<typeof getDictionary>[0]) {
  const dict = getDictionary(locale);
  return {
    dict,
    t: (key: string, params?: Record<string, string | number>) =>
      translate(dict, key, params),
  };
}

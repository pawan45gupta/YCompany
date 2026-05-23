"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { getDictionary, type Dictionary } from "./dictionary";
import { translate } from "./translate";

type I18nContextValue = {
  dict: Dictionary;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => {
    const dict = getDictionary();
    return {
      dict,
      t: (key: string, params?: Record<string, string | number>) =>
        translate(dict, key, params),
    };
  }, []);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return ctx;
}

/** Safe hook for components that may render outside provider (returns English fallback). */
export function useTranslationOptional() {
  const ctx = useContext(I18nContext);
  const dict = useMemo(() => getDictionary(), []);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(ctx?.dict ?? dict, key, params),
    [ctx, dict],
  );
  return { dict: ctx?.dict ?? dict, t };
}

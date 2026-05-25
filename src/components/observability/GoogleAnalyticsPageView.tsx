"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// The canonical `window.gtag` global type is declared once in
// `@/lib/observability/analytics`; we reuse it here so calls like
// `gtag("config", id, { page_path })` type-check identically.

type Props = {
  measurementId: string;
};

/** Sends GA4 page_view on App Router client navigations. */
export function GoogleAnalyticsPageView({ measurementId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag("config", measurementId, {
      page_path: pagePath,
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}

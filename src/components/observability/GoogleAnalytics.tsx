import Script from "next/script";
import { Suspense } from "react";
import { getGaMeasurementId } from "@/lib/observability/env";
import { GoogleAnalyticsPageView } from "@/components/observability/GoogleAnalyticsPageView";

export function GoogleAnalyticsProvider() {
  const gaId = getGaMeasurementId();
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: true });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView measurementId={gaId} />
      </Suspense>
    </>
  );
}

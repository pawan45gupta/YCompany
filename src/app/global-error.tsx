"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { isSentryEnabled } from "@/lib/observability/env";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isSentryEnabled()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 48, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          We have been notified and are looking into it.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "12px 24px",
            borderRadius: 999,
            border: "none",
            background: "#1a1a1a",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

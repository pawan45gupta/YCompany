"use client";

import { Button, Container, Typography } from "@mui/material";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { isSentryEnabled } from "@/lib/observability/env";

type ErrorPageProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (isSentryEnabled()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
      <Typography variant="h1" sx={{ fontSize: "1.75rem", mb: 1 }}>
        {t("errors.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("errors.body")}
      </Typography>
      <Button variant="contained" onClick={() => reset()}>
        {t("errors.tryAgain")}
      </Button>
    </Container>
  );
}

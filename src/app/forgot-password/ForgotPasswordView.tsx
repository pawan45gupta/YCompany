"use client";

import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Stack,
  TextField,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useTranslation } from "@/i18n/client";
import { comfortableTextFieldSx } from "@/theme/form-fields";

type ApiErr = { error?: string };

export function ForgotPasswordView() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setLoading(false);
      if (!res.ok) {
        if (res.status === 429) {
          setError(t("api.tooManyRequests"));
          return;
        }
        const data: ApiErr = await res.json().catch(() => ({}));
        setError(data.error ?? t("signup.genericError"));
        return;
      }
      // The API intentionally returns 200/ok regardless of whether the
      // email exists (anti-enumeration). The UX is identical: show the
      // "check your inbox" confirmation.
      setSubmitted(true);
    } catch {
      setLoading(false);
      setError(t("signup.genericError"));
    }
  };

  if (submitted) {
    return (
      <AuthShell
        title={t("forgotPassword.sentTitle")}
        subtitle={t("forgotPassword.sentBody")}
        footer={
          <MuiLink
            component={Link}
            href="/login"
            underline="hover"
            sx={{ fontWeight: 600 }}
          >
            {t("forgotPassword.backToSignIn")}
          </MuiLink>
        }
      >
        {/* Dev hint shows only when bundler is in development mode. Vite/Next
            inline this so the prod bundle drops the branch. */}
        {process.env.NODE_ENV !== "production" && (
          <Alert severity="info" sx={{ width: "100%" }}>
            {t("forgotPassword.sentDevHint")}
          </Alert>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("forgotPassword.title")}
      subtitle={t("forgotPassword.subtitle")}
      footer={
        <MuiLink
          component={Link}
          href="/login"
          underline="hover"
          variant="body2"
        >
          {t("forgotPassword.backToSignIn")}
        </MuiLink>
      }
    >
      {error && (
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={submit} sx={{ width: "100%" }}>
        <Stack spacing={2.5}>
          <TextField
            label={t("forgotPassword.email")}
            type="email"
            autoComplete="email"
            required
            fullWidth
            size="medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={comfortableTextFieldSx}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || email.trim() === ""}
            sx={{ minHeight: 52, mt: 0.5 }}
          >
            {loading
              ? t("forgotPassword.submitting")
              : t("forgotPassword.submit")}
          </Button>
        </Stack>
      </Box>
    </AuthShell>
  );
}

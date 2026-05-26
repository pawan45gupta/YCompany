"use client";

import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { useTranslation } from "@/i18n/client";
import { comfortableTextFieldSx } from "@/theme/form-fields";

type Props = {
  token: string;
};

type ApiErr = { error?: string };

export function ResetPasswordView({ token }: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordOk = evaluatePassword(password).strong;
  const matches = password === confirm && confirm !== "";
  const canSubmit = passwordOk && matches && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!matches) {
      setError(t("resetPassword.mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      setLoading(false);
      if (!res.ok) {
        if (res.status === 429) {
          setError(t("api.tooManyRequests"));
          return;
        }
        const data: ApiErr = await res.json().catch(() => ({}));
        // 400s from this route are almost always invalid/expired token
        // (the body field is "Invalid or expired reset link"). Show the
        // i18n string for consistency, falling back to whatever the API
        // returned for password-validation failures.
        setError(
          res.status === 400 && data.error?.toLowerCase().includes("password")
            ? data.error
            : t("resetPassword.invalidToken"),
        );
        return;
      }
      setSuccess(true);
    } catch {
      setLoading(false);
      setError(t("signup.genericError"));
    }
  };

  if (success) {
    return (
      <AuthShell
        title={t("resetPassword.successTitle")}
        subtitle={t("resetPassword.successBody")}
        footer={
          <MuiLink
            component={Link}
            href="/login"
            underline="hover"
            sx={{ fontWeight: 600 }}
          >
            {t("resetPassword.goToSignIn")}
          </MuiLink>
        }
      >
        <Typography variant="body2" color="text.secondary">
          ✓
        </Typography>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("resetPassword.title")}
      subtitle={t("resetPassword.subtitle")}
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
            label={t("resetPassword.password")}
            type="password"
            autoComplete="new-password"
            required
            fullWidth
            size="medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={comfortableTextFieldSx}
          />
          <TextField
            label={t("resetPassword.confirmPassword")}
            type="password"
            autoComplete="new-password"
            required
            fullWidth
            size="medium"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={confirm !== "" && !matches}
            helperText={
              confirm !== "" && !matches ? t("resetPassword.mismatch") : " "
            }
            sx={comfortableTextFieldSx}
          />
          <PasswordChecklist password={password} />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!canSubmit}
            sx={{ minHeight: 52, mt: 0.5 }}
          >
            {loading
              ? t("resetPassword.submitting")
              : t("resetPassword.submit")}
          </Button>
        </Stack>
      </Box>
    </AuthShell>
  );
}

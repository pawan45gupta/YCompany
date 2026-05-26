"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import type { OAuthProviderId } from "@/lib/auth-providers";
import { getSafeCallbackUrl } from "@/lib/auth-redirect";
import { evaluatePassword } from "@/lib/auth/password-policy";
import { useTranslation } from "@/i18n/client";
import { comfortableTextFieldSx } from "@/theme/form-fields";

type Props = {
  oauthProviders: OAuthProviderId[];
};

type ApiErr = { error?: string };

function SignupForm({ oauthProviders }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasSocial = oauthProviders.length > 0;
  const passwordOk = evaluatePassword(password).strong;
  const canSubmit = email.trim() !== "" && passwordOk && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data: ApiErr = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError(t("signup.emailTaken"));
        } else if (res.status === 429) {
          setError(t("api.tooManyRequests"));
        } else {
          setError(data.error ?? t("signup.genericError"));
        }
        setLoading(false);
        return;
      }

      // 201 — account created. Auto-sign-in so the user lands on the same
      // callbackUrl as login would. We deliberately do *not* surface
      // sign-in errors here (the account already exists; the user can
      // sign in manually from /login if NextAuth fails for some reason).
      setSuccess(true);
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      setLoading(false);
      if (signInRes?.error) {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t("signup.genericError"));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("signup.title")}
      subtitle={t("signup.subtitle")}
      footer={
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: "center", lineHeight: 1.5 }}
        >
          {t("login.privacyNote")}
        </Typography>
      }
    >
      {error && (
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      )}
      {success && !error && (
        <Alert severity="success" sx={{ width: "100%" }}>
          {t("signup.successAutoSignIn")}
        </Alert>
      )}

      {hasSocial && (
        <Box sx={{ width: "100%" }}>
          <SocialSignInButtons providers={oauthProviders} callbackUrl={callbackUrl} />
        </Box>
      )}

      {hasSocial && (
        <Divider sx={{ width: "100%" }}>
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.5 }}>
            {t("login.continueWithEmail")}
          </Typography>
        </Divider>
      )}

      <Box component="form" onSubmit={submit} sx={{ width: "100%" }}>
        <Stack spacing={2.5}>
          <TextField
            label={t("signup.name")}
            type="text"
            autoComplete="name"
            fullWidth
            size="medium"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={comfortableTextFieldSx}
          />
          <TextField
            label={t("signup.email")}
            type="email"
            autoComplete="email"
            required
            fullWidth
            size="medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={comfortableTextFieldSx}
          />
          <TextField
            label={t("signup.password")}
            type="password"
            autoComplete="new-password"
            required
            fullWidth
            size="medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? t("signup.submitting") : t("signup.submit")}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        {t("signup.haveAccount")}{" "}
        <MuiLink
          component={Link}
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          underline="hover"
          sx={{ fontWeight: 600 }}
        >
          {t("signup.signIn")}
        </MuiLink>
      </Typography>
    </AuthShell>
  );
}

function SignupFallback() {
  const { t } = useTranslation();
  return (
    <Container sx={{ py: 8, textAlign: "center" }}>
      <Typography color="text.secondary">{t("common.loading")}</Typography>
    </Container>
  );
}

export function SignupView({ oauthProviders }: Props) {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm oauthProviders={oauthProviders} />
    </Suspense>
  );
}

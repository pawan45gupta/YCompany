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
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import type { OAuthProviderId } from "@/lib/auth-providers";
import { getAuthErrorMessageKey } from "@/lib/auth-errors";
import { getSafeCallbackUrl } from "@/lib/auth-redirect";
import { trackLogin } from "@/lib/observability/analytics";
import { useTranslation } from "@/i18n/client";
import { comfortableTextFieldSx } from "@/theme/form-fields";

type Props = {
  oauthProviders: OAuthProviderId[];
};

function LoginForm({ oauthProviders }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasSocial = oauthProviders.length > 0;
  const authError = searchParams.get("error");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t("login.invalidCredentials"));
      return;
    }
    trackLogin("credentials");
    router.push(callbackUrl);
    router.refresh();
  };

  // Forward the active callbackUrl onto Sign up so a user who arrived at
  // /login because they tried to view /account ends up there after signing
  // up too. Same idea for the Forgot link (it doesn't need a callback but
  // we may want it later for UTM-style attribution).
  const signupHref = `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <AuthShell
      title={t("login.title")}
      subtitle={t("login.subtitle")}
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
      {(authError || error) && (
        <Alert severity="error" sx={{ width: "100%" }}>
          {error ?? t(getAuthErrorMessageKey(authError))}
        </Alert>
      )}

      {hasSocial && (
        <Box sx={{ width: "100%" }}>
          <SocialSignInButtons
            providers={oauthProviders}
            callbackUrl={callbackUrl}
          />
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
            label={t("login.email")}
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
            label={t("login.password")}
            type="password"
            autoComplete="current-password"
            required
            fullWidth
            size="medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={comfortableTextFieldSx}
          />
          {/* Forgot password lives directly under the password field — that's
              where users instinctively look after a failed login. */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -1 }}>
            <MuiLink
              component={Link}
              href="/forgot-password"
              variant="body2"
              underline="hover"
            >
              {t("login.forgotPassword")}
            </MuiLink>
          </Box>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ minHeight: 52, mt: 0.5 }}
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        {t("login.noAccount")}{" "}
        <MuiLink component={Link} href={signupHref} underline="hover" sx={{ fontWeight: 600 }}>
          {t("login.createAccount")}
        </MuiLink>
      </Typography>
    </AuthShell>
  );
}

function LoginFallback() {
  const { t } = useTranslation();
  return (
    <Container sx={{ py: 8, textAlign: "center" }}>
      <Typography color="text.secondary">{t("common.loading")}</Typography>
    </Container>
  );
}

export function LoginView({ oauthProviders }: Props) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm oauthProviders={oauthProviders} />
    </Suspense>
  );
}

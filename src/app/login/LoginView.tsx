"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { YCompanyLogo } from "@/components/YCompanyLogo";
import type { OAuthProviderId } from "@/lib/auth-providers";
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

  return (
    <Box
      sx={{
        minHeight: { xs: "calc(100vh - 120px)", md: "calc(100vh - 140px)" },
        display: "flex",
        alignItems: "center",
        py: { xs: 4, md: 6 },
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            maxWidth: 440,
            mx: "auto",
          }}
        >
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            <YCompanyLogo variant="full" color="dark" height={40} />

            <Box sx={{ textAlign: "center", width: "100%" }}>
              <Typography variant="h1" sx={{ fontSize: "1.75rem", mb: 0.75 }}>
                {t("login.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {t("login.subtitle")}
              </Typography>
            </Box>

            {(authError || error) && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {error ?? t("login.oauthError")}
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

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center", lineHeight: 1.5 }}
            >
              {t("login.privacyNote")}
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
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

"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { YCompanyLogo } from "@/components/YCompanyLogo";
import { getSafeCallbackUrl } from "@/lib/auth-redirect";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTranslation } from "@/i18n/client";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 8 } }}>
      <Paper elevation={0} variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <YCompanyLogo variant="full" color="dark" height={40} />
        </Box>
        <Typography variant="h1" sx={{ fontSize: "1.75rem", mb: 1 }}>
          {t("login.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("login.helper")}
        </Typography>
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              label={t("login.email")}
              type="email"
              autoComplete="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label={t("login.password")}
              type="password"
              autoComplete="current-password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? t("login.submitting") : t("login.submit")}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

function LoginFallback() {
  const { t } = useTranslation();
  return <Container sx={{ py: 8 }}>{t("common.loading")}</Container>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

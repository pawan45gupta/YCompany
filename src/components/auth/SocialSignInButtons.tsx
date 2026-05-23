"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import type { OAuthProviderId } from "@/lib/auth-providers";
import { useTranslation } from "@/i18n/client";

type Props = {
  providers: OAuthProviderId[];
  callbackUrl: string;
};

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05 1.88-3.51 1.9-1.46.02-1.93-.86-3.6-.86-1.67 0-2.19.84-3.57.88-1.38.04-2.43-1.27-3.41-2.22-1.86-1.83-3.28-5.15-1.37-7.4 1.34-1.56 3.52-2.48 5.5-2.51 1.36-.03 2.65.9 3.49.9.84 0 2.41-1.11 4.07-.95.69.03 2.63.28 3.87 2.1-.1.06-2.31 1.35-2.28 4.02.03 3.19 2.77 4.25 2.79 4.26-.02.07-.44 1.52-1.36 3.02zM14.02 3.5c.73-.89 1.23-2.13 1.09-3.36-1.06.04-2.34.71-3.1 1.6-.68.79-1.27 2.05-1.11 3.26 1.18.09 2.38-.6 3.12-1.5z" />
    </svg>
  );
}

const providerMeta: Record<
  OAuthProviderId,
  {
    icon: ReactNode;
    sx: Record<string, unknown>;
  }
> = {
  google: {
    icon: <GoogleIcon />,
    sx: {
      bgcolor: "#fff",
      color: "#1a1a1a",
      border: 1,
      borderColor: "divider",
      "&:hover": { bgcolor: "grey.50", borderColor: "grey.400" },
    },
  },
  github: {
    icon: <GitHubIcon />,
    sx: {
      bgcolor: "#24292f",
      color: "#fff",
      "&:hover": { bgcolor: "#32383f" },
    },
  },
  facebook: {
    icon: <FacebookIcon />,
    sx: {
      bgcolor: "#1877F2",
      color: "#fff",
      "&:hover": { bgcolor: "#166fe5" },
    },
  },
  apple: {
    icon: <AppleIcon />,
    sx: {
      bgcolor: "#000",
      color: "#fff",
      "&:hover": { bgcolor: "#1a1a1a" },
    },
  },
};

export function SocialSignInButtons({ providers, callbackUrl }: Props) {
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<OAuthProviderId | null>(null);

  if (providers.length === 0) return null;

  const handleSocialSignIn = (id: OAuthProviderId) => {
    setLoadingId(id);
    void signIn(id, { callbackUrl });
  };

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: providers.length > 1 ? "1fr 1fr" : "1fr",
        }}
      >
        {providers.map((id) => {
          const meta = providerMeta[id];
          const label = t(`login.providers.${id}`);
          return (
            <Button
              key={id}
              type="button"
              variant="contained"
              disableElevation
              disabled={loadingId !== null}
              onClick={() => handleSocialSignIn(id)}
              startIcon={meta.icon}
              sx={{
                minHeight: 48,
                justifyContent: "flex-start",
                px: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9375rem",
                ...meta.sx,
              }}
              aria-label={t("login.continueWith", { provider: label })}
            >
              {label}
            </Button>
          );
        })}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: "center", display: "block", pt: 0.5 }}
      >
        {t("login.socialHint")}
      </Typography>
    </Stack>
  );
}

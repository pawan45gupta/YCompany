"use client";

import { Button } from "@mui/material";
import { DEFAULT_SIGNED_IN_URL } from "@/lib/auth-redirect";
import { useTranslation } from "@/i18n/client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const { t } = useTranslation();
  return (
    <Button
      variant="contained"
      color="inherit"
      fullWidth
      onClick={() => signOut({ callbackUrl: DEFAULT_SIGNED_IN_URL })}
      sx={{ minHeight: 40, height: 40 }}
    >
      {t("common.signOut")}
    </Button>
  );
}

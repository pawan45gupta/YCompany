"use client";

import { Button, type ButtonProps } from "@mui/material";
import { DEFAULT_SIGNED_IN_URL } from "@/lib/auth-redirect";
import { useTranslation } from "@/i18n/client";
import { signOut } from "next-auth/react";

type Props = {
  fullWidth?: boolean;
  sx?: ButtonProps["sx"];
};

export function SignOutButton({ fullWidth = true, sx }: Props) {
  const { t } = useTranslation();
  return (
    <Button
      variant="contained"
      color="inherit"
      fullWidth={fullWidth}
      onClick={() => signOut({ callbackUrl: DEFAULT_SIGNED_IN_URL })}
      sx={[
        {
          minHeight: 40,
          height: 40,
          whiteSpace: "nowrap",
          px: 2.5,
          flexShrink: 0,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {t("common.signOut")}
    </Button>
  );
}

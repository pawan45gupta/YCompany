"use client";

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useTranslation } from "@/i18n/client";

const iconButtonSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
} as const;

export function UserMenu() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!session?.user) return null;

  const email = session.user.email ?? "";
  const initial = (session.user.name?.[0] ?? email[0] ?? "U").toUpperCase();

  return (
    <>
      <IconButton
        color="inherit"
        aria-label={t("userMenu.accountMenuAria")}
        aria-controls={open ? "user-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={iconButtonSx}
      >
        <AccountCircleOutlinedIcon sx={{ fontSize: 28 }} />
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
      >
        <MenuItem disabled sx={{ opacity: 1, cursor: "default" }}>
          <ListItemText
            primary={session.user.name ?? t("account.signedInFallback")}
            secondary={email}
            slotProps={{
              primary: { sx: { fontWeight: 600 } },
              secondary: { sx: { fontSize: "0.8rem" } },
            }}
          />
        </MenuItem>
        <Divider />
        <MenuItem component={Link} href="/account">
          <ListItemIcon>
            <Typography
              variant="body2"
              color="primary.main"
              sx={{ width: 24, textAlign: "center", fontWeight: 600 }}
            >
              {initial}
            </Typography>
          </ListItemIcon>
          <ListItemText primary={t("common.myAccount")} />
        </MenuItem>
        <MenuItem
          onClick={() => signOut({ callbackUrl: "/products" })}
        >
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("common.signOut")} />
        </MenuItem>
      </Menu>
    </>
  );
}

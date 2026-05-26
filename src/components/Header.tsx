"use client";

import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import {
  AppBar,
  Badge,
  Box,
  Container,
  Drawer,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { UserMenu } from "@/components/UserMenu";
import { YCompanyLogo } from "@/components/YCompanyLogo";
import { useTranslation } from "@/i18n/client";
import { trackSearch } from "@/lib/observability/analytics";

const navLinkSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  px: 1.5,
  fontWeight: 600,
  fontSize: "0.9375rem",
  lineHeight: 1,
  color: "inherit",
  textDecoration: "none",
  borderRadius: 999,
  flexShrink: 0,
  "&:hover": { opacity: 0.85 },
} as const;

export function Header() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { lines } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qv = q.trim();
    if (qv) trackSearch(qv);
    router.push(qv ? `/search?q=${encodeURIComponent(qv)}` : "/search");
  };

  const nav = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        flexShrink: 0,
      }}
    >
      <MuiLink component={Link} href="/products" underline="none" sx={navLinkSx}>
        {t("common.shop")}
      </MuiLink>
      <MuiLink component={Link} href="/search" underline="none" sx={navLinkSx}>
        {t("common.search")}
      </MuiLink>
      {session ? (
        <UserMenu />
      ) : (
        <>
          <MuiLink component={Link} href="/login" underline="none" sx={navLinkSx}>
            {t("common.signIn")}
          </MuiLink>
          <MuiLink
            component={Link}
            href="/signup"
            underline="none"
            sx={{
              ...navLinkSx,
              color: "primary.contrastText",
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark", opacity: 1 },
            }}
          >
            {t("common.signUp")}
          </MuiLink>
        </>
      )}
      <IconButton
        component={Link}
        href="/cart"
        color="inherit"
        size="medium"
        aria-label={t("header.cartAria")}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          ml: 0.5,
        }}
      >
        <Badge badgeContent={cartCount} color="secondary">
          <ShoppingBagOutlinedIcon />
        </Badge>
      </IconButton>
    </Box>
  );

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, py: 1, alignItems: "center" }}>
          <IconButton
            color="inherit"
            sx={{ display: { md: "none" } }}
            onClick={() => setMobileOpen(true)}
            aria-label={t("header.openMenu")}
          >
            <MenuIcon />
          </IconButton>
          <Link href="/" aria-label={t("common.brand")} style={{ textDecoration: "none", lineHeight: 0 }}>
            <YCompanyLogo variant="full" color="light" height={34} />
          </Link>
          <Box
            component="form"
            onSubmit={onSearch}
            sx={{
              flex: 1,
              maxWidth: 420,
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
            }}
          >
            <TextField
              size="medium"
              fullWidth
              placeholder={t("header.searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.paper",
                  borderRadius: 999,
                  minHeight: 48,
                  alignItems: "center",
                },
                "& .MuiOutlinedInput-input": {
                  py: 1.25,
                  fontSize: "0.9375rem",
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" edge="end" aria-label={t("header.searchAria")}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <Box sx={{ flex: 1, display: { xs: "block", sm: "none" } }} />
          <Box sx={{ display: { xs: "none", md: "flex" } }}>{nav}</Box>
        </Toolbar>
      </Container>
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, p: 2 }} role="presentation">
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t("header.menu")}
          </Typography>
          <Stack spacing={1}>
            <MuiLink component={Link} href="/products" onClick={() => setMobileOpen(false)}>
              {t("common.shop")}
            </MuiLink>
            <MuiLink component={Link} href="/search" onClick={() => setMobileOpen(false)}>
              {t("common.search")}
            </MuiLink>
            {session ? (
              <>
                <MuiLink component={Link} href="/account" onClick={() => setMobileOpen(false)}>
                  {t("common.myAccount")}
                </MuiLink>
                <MuiLink
                  component="button"
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut({ callbackUrl: "/products" });
                  }}
                  sx={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    font: "inherit",
                    color: "primary.main",
                    textAlign: "left",
                    p: 0,
                  }}
                >
                  {t("common.signOut")}
                </MuiLink>
              </>
            ) : (
              <>
                <MuiLink component={Link} href="/login" onClick={() => setMobileOpen(false)}>
                  {t("common.signIn")}
                </MuiLink>
                <MuiLink
                  component={Link}
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  sx={{ fontWeight: 600 }}
                >
                  {t("common.signUp")}
                </MuiLink>
              </>
            )}
            <MuiLink component={Link} href="/cart" onClick={() => setMobileOpen(false)}>
              {t("header.cartWithCount", { count: cartCount })}
            </MuiLink>
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}

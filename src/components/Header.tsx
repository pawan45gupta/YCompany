"use client";

import MenuIcon from "@mui/icons-material/Menu";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import {
  AppBar,
  Badge,
  Box,
  Container,
  Drawer,
  IconButton,
  Link as MuiLink,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductSearchAutocomplete } from "@/components/ProductSearchAutocomplete";
import { UserMenu } from "@/components/UserMenu";
import { YCompanyLogo } from "@/components/YCompanyLogo";
import { useTranslation } from "@/i18n/client";
import { trackSearch } from "@/lib/observability/analytics";
import type { Product } from "@/types/product";

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

  const navigateToSearch = (query: string) => {
    const qv = query.trim();
    if (qv) trackSearch(qv);
    router.push(qv ? `/search?q=${encodeURIComponent(qv)}` : "/search");
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSearch(q);
  };

  const onProductSelect = (product: Product) => {
    setQ(product.name);
    navigateToSearch(product.name);
  };

  const searchInputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "background.paper",
      borderRadius: 999,
      minHeight: { xs: 44, sm: 48 },
      alignItems: "center",
    },
    "& .MuiOutlinedInput-input": {
      py: 1.25,
      fontSize: "0.9375rem",
    },
  } as const;

  const searchForm = (extraSx = {}) => (
    <Box
      component="form"
      onSubmit={onSearch}
      sx={{ width: "100%", minWidth: 0, ...extraSx }}
    >
      <ProductSearchAutocomplete
        value={q}
        onChange={setQ}
        onProductSelect={onProductSelect}
        placeholder={t("header.searchPlaceholder")}
        inputSx={searchInputSx}
      />
    </Box>
  );

  const cartButton = (
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
      }}
    >
      <Badge badgeContent={cartCount} color="secondary">
        <ShoppingBagOutlinedIcon />
      </Badge>
    </IconButton>
  );

  const authControls = (
    <>
      {session ? (
        <UserMenu />
      ) : (
        <>
          <MuiLink
            component={Link}
            href="/login"
            underline="none"
            sx={{
              ...navLinkSx,
              display: { xs: "none", sm: "inline-flex" },
            }}
          >
            {t("common.signIn")}
          </MuiLink>
          <MuiLink
            component={Link}
            href="/signup"
            underline="none"
            sx={{
              ...navLinkSx,
              display: { xs: "none", md: "inline-flex" },
              color: "primary.contrastText",
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark", opacity: 1 },
            }}
          >
            {t("common.signUp")}
          </MuiLink>
        </>
      )}
    </>
  );

  const desktopNav = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 0.5,
        flexShrink: 0,
        minWidth: 0,
      }}
    >
      <MuiLink
        component={Link}
        href="/products"
        underline="none"
        sx={{ ...navLinkSx, display: { xs: "none", md: "inline-flex" } }}
      >
        {t("common.shop")}
      </MuiLink>
      <MuiLink
        component={Link}
        href="/search"
        underline="none"
        sx={{ ...navLinkSx, display: { xs: "none", md: "inline-flex" } }}
      >
        {t("common.search")}
      </MuiLink>
      {authControls}
      {cartButton}
    </Box>
  );

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box
            sx={{
              display: "grid",
              width: "100%",
              alignItems: "center",
              columnGap: { xs: 1, md: 2 },
              rowGap: { xs: 1, md: 0 },
              gridTemplateColumns: {
                xs: "auto 1fr auto",
                md: "minmax(0, 1fr) minmax(240px, 480px) minmax(0, 1fr)",
              },
              gridTemplateRows: { xs: "auto auto", md: "auto" },
            }}
          >
            <Box
              sx={{
                gridColumn: 1,
                gridRow: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                justifySelf: "start",
                minWidth: 0,
              }}
            >
              <IconButton
                color="inherit"
                sx={{ display: { md: "none" }, flexShrink: 0 }}
                onClick={() => setMobileOpen(true)}
                aria-label={t("header.openMenu")}
              >
                <MenuIcon />
              </IconButton>
              <Link
                href="/"
                aria-label={t("common.brand")}
                style={{ textDecoration: "none", lineHeight: 0, flexShrink: 0 }}
              >
                <YCompanyLogo variant="full" color="light" height={34} />
              </Link>
            </Box>

            <Box
              sx={{
                gridColumn: { xs: "1 / -1", md: 2 },
                gridRow: { xs: 2, md: 1 },
                justifySelf: "center",
                width: "100%",
                maxWidth: 480,
                minWidth: 0,
              }}
            >
              {searchForm()}
            </Box>

            <Box
              sx={{
                gridColumn: { xs: 3, md: 3 },
                gridRow: 1,
                justifySelf: "end",
                minWidth: 0,
              }}
            >
              {desktopNav}
            </Box>
          </Box>
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

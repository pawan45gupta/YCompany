"use client";

import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { CouponField } from "@/components/CouponField";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/hooks/api";
import { useTranslation } from "@/i18n/client";
import { computeCartTotals, formatMoney } from "@/lib/cart-totals";
import { comfortableTextFieldSx } from "@/theme/form-fields";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const { lines } = useCart();
  const [coupon, setCoupon] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const { startCheckout, isPending: loading, errorMessage } = useCheckout();

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("coupon");
    if (c) setCoupon(c.trim().toUpperCase());
  }, []);

  const totals = useMemo(
    () => computeCartTotals(lines, coupon),
    [lines, coupon],
  );

  const email = session?.user?.email ?? guestEmail.trim();
  const emailValid = email.includes("@") && email.includes(".");
  const canPay = totals.rows.length > 0 && emailValid;

  const pay = () => {
    void startCheckout({
      items: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
      couponCode: coupon.trim() || undefined,
      customerEmail: session?.user?.email ? undefined : guestEmail.trim(),
    });
  };

  if (status === "loading") {
    return (
      <Container sx={{ py: 6 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          {t("checkout.loading")}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: "2rem" }}>
          {t("checkout.title")}
        </Typography>
        <Stack
          sx={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "center",
          }}
        >
          <Chip
            icon={<ShoppingBagOutlinedIcon />}
            label={t("checkout.breadcrumbCart")}
            size="small"
            variant="outlined"
            component={Link}
            href="/cart"
            clickable
          />
          <Typography variant="body2" color="text.secondary">
            →
          </Typography>
          <Chip label={t("checkout.breadcrumbCheckout")} size="small" color="primary" />
          <Chip label={t("checkout.securePayment")} size="small" variant="outlined" />
        </Stack>
      </Stack>

      {totals.rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t("checkout.emptyTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t("checkout.emptyBody")}
          </Typography>
          <Button component={Link} href="/products" variant="contained">
            {t("common.browseShop")}
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 380px" },
            alignItems: "start",
          }}
        >
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {t("checkout.stepContact")}
              </Typography>
              {session?.user?.email ? (
                <Alert
                  icon={<CheckCircleOutlineOutlinedIcon fontSize="inherit" />}
                  severity="success"
                  variant="outlined"
                  sx={{ mb: 0 }}
                >
                  {t("checkout.signedInReceipt", { email: session.user.email })}
                </Alert>
              ) : (
                <TextField
                  required
                  fullWidth
                  size="medium"
                  type="email"
                  placeholder={t("checkout.emailPlaceholder")}
                  label={t("checkout.emailLabel")}
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  autoComplete="email"
                  error={guestEmail.length > 0 && !emailValid}
                  helperText={
                    guestEmail.length > 0 && !emailValid
                      ? t("checkout.emailInvalid")
                      : t("checkout.emailHelper")
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon color="action" fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={comfortableTextFieldSx}
                />
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {t("checkout.stepPromo")}
              </Typography>
              <CouponField
                value={coupon}
                onChange={setCoupon}
                subtotalCents={totals.subtotalCents}
              />
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "action.hover",
                display: { xs: "none", md: "block" },
              }}
            >
              <Stack sx={{ flexDirection: "row", gap: 1.5, alignItems: "flex-start" }}>
                <LockOutlinedIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t("checkout.stripeNote")}
                </Typography>
              </Stack>
            </Paper>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 2,
              position: { md: "sticky" },
              top: { md: 88 },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              {t("checkout.orderSummary")}
            </Typography>
            <Stack spacing={2} sx={{ mb: 2, maxHeight: 320, overflow: "auto" }}>
              {totals.rows.map(({ product, quantity, lineTotalCents }) => (
                <Stack
                  key={product.id}
                  sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: 56,
                      height: 56,
                      borderRadius: 1,
                      overflow: "hidden",
                      flexShrink: 0,
                      bgcolor: "grey.100",
                    }}
                  >
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="56px"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("common.qty")} {quantity}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
                    {formatMoney(lineTotalCents)}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography color="text.secondary">{t("common.subtotal")}</Typography>
                <Typography>{formatMoney(totals.subtotalCents)}</Typography>
              </Box>
              {totals.discountCents > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">{t("common.discount")}</Typography>
                  <Typography color="success.main">
                    −{formatMoney(totals.discountCents)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography color="text.secondary">
                  {t("common.shipping")}
                  {totals.freeShipping ? t("checkout.shippingFree") : ""}
                </Typography>
                <Typography>{formatMoney(totals.shippingCents)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t("common.estimatedTotal")}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {formatMoney(totals.totalCents)}
                </Typography>
              </Box>
            </Stack>

            {totals.couponResult?.valid === false && coupon.trim() && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t("checkout.couponWarning")}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!canPay || loading}
              onClick={() => void pay()}
              sx={{ minHeight: 52, mb: 1.5 }}
            >
              {loading
                ? t("checkout.redirecting")
                : t("checkout.pay", { total: formatMoney(totals.totalCents) })}
            </Button>
            <Button component={Link} href="/cart" color="inherit" fullWidth>
              {t("checkout.editCart")}
            </Button>

            <Stack
              sx={{
                mt: 2,
                display: { xs: "flex", md: "none" },
                flexDirection: "row",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <LockOutlinedIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {t("checkout.stripeNoteShort")}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      )}
    </Container>
  );
}

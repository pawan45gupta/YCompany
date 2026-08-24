"use client";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState, useEffect, useCallback, type ReactNode } from "react";
import { CouponField } from "@/components/CouponField";
import { AppLoader } from "@/components/AppLoader";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/hooks/api";
import { useTranslation } from "@/i18n/client";
import { computeCartTotals, formatMoney, type CartTotals } from "@/lib/cart-totals";
import type { Product } from "@/types/product";
import {
  buildGaItemsFromCartRows,
  stashCheckoutForPurchase,
  trackBeginCheckout,
} from "@/lib/observability/analytics";
import { comfortableTextFieldSx } from "@/theme/form-fields";

function getCheckoutStepStyles(done?: boolean, active?: boolean) {
  if (done) {
    return {
      bgcolor: "success.main",
      color: "primary.contrastText",
    } as const;
  }
  if (active) {
    return {
      bgcolor: "primary.main",
      color: "primary.contrastText",
    } as const;
  }
  return {
    bgcolor: "grey.200",
    color: "text.secondary",
  } as const;
}

function CheckoutStep({
  label,
  active,
  done,
}: Readonly<{ label: string; active?: boolean; done?: boolean }>) {
  const stepStyles = getCheckoutStepStyles(done, active);

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.8125rem",
          fontWeight: 700,
          flexShrink: 0,
          bgcolor: stepStyles.bgcolor,
          color: stepStyles.color,
        }}
      >
        {done ? "✓" : label.charAt(0)}
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: active ? 600 : 500,
          color: active ? "text.primary" : "text.secondary",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function SectionCard({
  step,
  title,
  icon,
  children,
}: Readonly<{
  step: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}>) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, md: 3 },
          py: 2,
          bgcolor: "grey.50",
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "secondary.main",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            Step {step}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {title}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>{children}</Box>
    </Paper>
  );
}

function SummaryLine({
  label,
  value,
  emphasize,
  success,
}: Readonly<{
  label: string;
  value: string;
  emphasize?: boolean;
  success?: boolean;
}>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography
        variant={emphasize ? "subtitle1" : "body2"}
        color={emphasize ? "text.primary" : "text.secondary"}
        sx={{ fontWeight: emphasize ? 600 : 400 }}
      >
        {label}
      </Typography>
      <Typography
        variant={emphasize ? "subtitle1" : "body2"}
        sx={{
          fontWeight: emphasize ? 700 : 500,
          color: success ? "success.main" : "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function OrderLine({
  product,
  quantity,
  lineTotalCents,
}: Readonly<{
  product: Product;
  quantity: number;
  lineTotalCents: number;
}>) {
  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Box
        sx={{
          position: "relative",
          width: 64,
          height: 64,
          borderRadius: 2,
          overflow: "hidden",
          flexShrink: 0,
          bgcolor: "grey.100",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Image src={product.image} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {product.brand} · {product.category}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("common.qty")} {quantity}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>
        {formatMoney(lineTotalCents)}
      </Typography>
    </Stack>
  );
}

function CheckoutLoading() {
  const { t } = useTranslation();
  return <AppLoader label={t("checkout.loading")} />;
}

function CheckoutPageHeader() {
  const { t } = useTranslation();

  return (
    <Stack spacing={2.5} sx={{ mb: 4 }}>
      <Button
        component={Link}
        href="/cart"
        startIcon={<ArrowBackOutlinedIcon />}
        color="inherit"
        sx={{ alignSelf: "flex-start", px: 0 }}
      >
        {t("checkout.breadcrumbCart")}
      </Button>

      <Box>
        <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2rem" }, mb: 0.75 }}>
          {t("checkout.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.65 }}>
          {t("checkout.subtitle")}
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 2, sm: 3 }}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 3 }}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <CheckoutStep label={t("checkout.breadcrumbCart")} done />
            <CheckoutStep label={t("checkout.breadcrumbCheckout")} active />
            <CheckoutStep label={t("checkout.breadcrumbPay")} />
          </Stack>
          <Chip
            icon={<VerifiedUserOutlinedIcon />}
            label={t("checkout.securePayment")}
            size="small"
            color="secondary"
            variant="outlined"
          />
        </Stack>
      </Paper>
    </Stack>
  );
}

function CheckoutEmptyState() {
  const { t } = useTranslation();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 4, md: 5 },
        textAlign: "center",
        borderRadius: 3,
        maxWidth: 480,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
        }}
      >
        <ShoppingBagOutlinedIcon color="action" />
      </Box>
      <Typography variant="h6" gutterBottom>
        {t("checkout.emptyTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("checkout.emptyBody")}
      </Typography>
      <Button component={Link} href="/products" variant="contained" size="large">
        {t("common.browseShop")}
      </Button>
    </Paper>
  );
}

function CheckoutContactSection({
  signedInEmail,
  guestEmail,
  emailValid,
  onGuestEmailChange,
}: Readonly<{
  signedInEmail?: string | null;
  guestEmail: string;
  emailValid: boolean;
  onGuestEmailChange: (value: string) => void;
}>) {
  const { t } = useTranslation();
  const showEmailError = guestEmail.length > 0 && !emailValid;

  return (
    <SectionCard
      step="1"
      title={t("checkout.stepContact")}
      icon={<EmailOutlinedIcon fontSize="small" />}
    >
      {signedInEmail ? (
        <Alert
          icon={<CheckCircleOutlineOutlinedIcon fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          {t("checkout.signedInReceipt", { email: signedInEmail })}
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
          onChange={(e) => onGuestEmailChange(e.target.value)}
          autoComplete="email"
          error={showEmailError}
          helperText={showEmailError ? t("checkout.emailInvalid") : t("checkout.emailHelper")}
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
    </SectionCard>
  );
}

function CheckoutTrustBanner() {
  const { t } = useTranslation();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: "grey.50",
        display: { xs: "none", lg: "block" },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <LockOutlinedIcon fontSize="small" color="secondary" sx={{ mt: 0.25 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t("checkout.trustTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {t("checkout.stripeNote")}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function getItemCountLabel(count: number, t: ReturnType<typeof useTranslation>["t"]) {
  return count === 1
    ? t("checkout.itemCount", { count })
    : t("checkout.itemsCount", { count });
}

function CheckoutOrderSummary({
  totals,
  coupon,
  canPay,
  loading,
  errorMessage,
  onPay,
}: Readonly<{
  totals: CartTotals;
  coupon: string;
  canPay: boolean;
  loading: boolean;
  errorMessage: string | null;
  onPay: () => void;
}>) {
  const { t } = useTranslation();
  const itemCount = totals.rows.reduce((sum, row) => sum + row.quantity, 0);
  const showCouponWarning = totals.couponResult?.valid === false && coupon.trim().length > 0;
  const shippingLabel = totals.freeShipping
    ? `${t("common.shipping")}${t("checkout.shippingFree")}`
    : t("common.shipping");

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        position: { lg: "sticky" },
        top: { lg: 88 },
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, md: 3 },
          py: 2.5,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t("checkout.orderSummary")}
          </Typography>
          <Chip
            label={getItemCountLabel(itemCount, t)}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.12)",
              color: "inherit",
              borderColor: "rgba(255,255,255,0.24)",
            }}
            variant="outlined"
          />
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2} sx={{ mb: 2.5, maxHeight: 340, overflow: "auto", pr: 0.5 }}>
          {totals.rows.map(({ product, quantity, lineTotalCents }) => (
            <OrderLine
              key={product.id}
              product={product}
              quantity={quantity}
              lineTotalCents={lineTotalCents}
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        <Stack spacing={1.25} sx={{ mb: 2.5 }}>
          <SummaryLine label={t("common.subtotal")} value={formatMoney(totals.subtotalCents)} />
          {totals.discountCents > 0 && (
            <SummaryLine
              label={t("common.discount")}
              value={`−${formatMoney(totals.discountCents)}`}
              success
            />
          )}
          <SummaryLine label={shippingLabel} value={formatMoney(totals.shippingCents)} />
          <Divider sx={{ my: 0.5 }} />
          <SummaryLine
            label={t("common.estimatedTotal")}
            value={formatMoney(totals.totalCents)}
            emphasize
          />
        </Stack>

        {showCouponWarning && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {t("checkout.couponWarning")}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!canPay || loading}
          onClick={onPay}
          sx={{ minHeight: 54, mb: 1.5, fontSize: "1rem" }}
        >
          {loading
            ? t("checkout.redirecting")
            : t("checkout.pay", { total: formatMoney(totals.totalCents) })}
        </Button>

        <Button component={Link} href="/cart" color="inherit" fullWidth>
          {t("checkout.editCart")}
        </Button>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2, alignItems: "flex-start", justifyContent: "center" }}
        >
          <LockOutlinedIcon sx={{ fontSize: 16, mt: 0.2 }} color="action" />
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            {t("checkout.stripeNoteShort")}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}

function CheckoutMainContent({
  signedInEmail,
  guestEmail,
  emailValid,
  onGuestEmailChange,
  coupon,
  onCouponChange,
  totals,
  canPay,
  loading,
  errorMessage,
  onPay,
}: Readonly<{
  signedInEmail?: string | null;
  guestEmail: string;
  emailValid: boolean;
  onGuestEmailChange: (value: string) => void;
  coupon: string;
  onCouponChange: (value: string) => void;
  totals: CartTotals;
  canPay: boolean;
  loading: boolean;
  errorMessage: string | null;
  onPay: () => void;
}>) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 400px" },
        alignItems: "start",
      }}
    >
      <Stack spacing={3}>
        <CheckoutContactSection
          signedInEmail={signedInEmail}
          guestEmail={guestEmail}
          emailValid={emailValid}
          onGuestEmailChange={onGuestEmailChange}
        />
        <SectionCard
          step="2"
          title={t("checkout.stepPromo")}
          icon={<LocalOfferOutlinedIcon fontSize="small" />}
        >
          <CouponField value={coupon} onChange={onCouponChange} subtotalCents={totals.subtotalCents} />
        </SectionCard>
        <CheckoutTrustBanner />
      </Stack>

      <CheckoutOrderSummary
        totals={totals}
        coupon={coupon}
        canPay={canPay}
        loading={loading}
        errorMessage={errorMessage}
        onPay={onPay}
      />
    </Box>
  );
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { lines } = useCart();
  const searchParams = useSearchParams();
  const urlCoupon = searchParams.get("coupon")?.trim().toUpperCase() ?? "";
  const [coupon, setCoupon] = useState(urlCoupon);
  const [guestEmail, setGuestEmail] = useState("");
  const { startCheckout, isPending: loading, errorMessage } = useCheckout();

  useEffect(() => {
    setCoupon(urlCoupon);
  }, [urlCoupon]);

  const totals = useMemo(
    () => computeCartTotals(lines, coupon),
    [lines, coupon],
  );

  const email = session?.user?.email ?? guestEmail.trim();
  const emailValid = email.includes("@") && email.includes(".");
  const canPay = totals.rows.length > 0 && emailValid;
  const isEmpty = totals.rows.length === 0;

  const pay = useCallback(() => {
    stashCheckoutForPurchase({
      currency: totals.rows[0]?.product.currency ?? "usd",
      valueCents: totals.totalCents,
    });
    trackBeginCheckout({
      currency: totals.rows[0]?.product.currency ?? "usd",
      valueCents: totals.totalCents,
      items: buildGaItemsFromCartRows(totals.rows),
      coupon: coupon.trim() || undefined,
    });
    void startCheckout({
      items: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
      couponCode: coupon.trim() || undefined,
      customerEmail: session?.user?.email ? undefined : guestEmail.trim(),
    });
  }, [coupon, guestEmail, lines, session?.user?.email, startCheckout, totals]);

  if (status === "loading") {
    return <CheckoutLoading />;
  }

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: { xs: "calc(100vh - 120px)", md: "calc(100vh - 140px)" },
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <CheckoutPageHeader />
        {isEmpty ? (
          <CheckoutEmptyState />
        ) : (
          <CheckoutMainContent
            signedInEmail={session?.user?.email}
            guestEmail={guestEmail}
            emailValid={emailValid}
            onGuestEmailChange={setGuestEmail}
            coupon={coupon}
            onCouponChange={setCoupon}
            totals={totals}
            canPay={canPay}
            loading={loading}
            errorMessage={errorMessage}
            onPay={pay}
          />
        )}
      </Container>
    </Box>
  );
}

"use client";

import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useSyncOrder } from "@/hooks/api";
import { useTranslation } from "@/i18n/client";
import { readStashedCheckout, trackPurchase } from "@/lib/observability/analytics";

function SuccessInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clear } = useCart();
  const { mutate: syncOrder } = useSyncOrder();

  useEffect(() => {
    if (sessionId) {
      const stashed = readStashedCheckout();
      trackPurchase({
        transactionId: sessionId,
        currency: stashed?.currency,
        valueCents: stashed?.valueCents,
      });
      clear();
      syncOrder({ sessionId });
    }
  }, [clear, sessionId, syncOrder]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 10 }, textAlign: "center" }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <CheckCircleOutlineOutlinedIcon color="success" sx={{ fontSize: 56 }} />
        <Typography variant="h1" sx={{ fontSize: "1.75rem" }}>
          {t("checkoutSuccess.title")}
        </Typography>
        <Typography color="text.secondary">
          {t("checkoutSuccess.body")}
        </Typography>
        {sessionId && (
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
            {t("checkoutSuccess.session", { id: sessionId })}
          </Typography>
        )}
        <Stack spacing={1.5} sx={{ mt: 2, width: "100%", maxWidth: 280 }}>
          <Button component={Link} href="/account" variant="contained" fullWidth>
            {t("checkoutSuccess.viewOrders")}
          </Button>
          <Button component={Link} href="/products" variant="outlined" fullWidth>
            {t("common.continueShopping")}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

function SuccessFallback() {
  const { t } = useTranslation();
  return (
    <Container sx={{ py: 8 }}>
      <Typography>{t("common.loading")}</Typography>
    </Container>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessInner />
    </Suspense>
  );
}

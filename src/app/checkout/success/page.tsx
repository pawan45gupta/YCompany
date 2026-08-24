"use client";

import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { YCompanyLogo } from "@/components/YCompanyLogo";
import { useCart } from "@/context/CartContext";
import { useSyncOrder } from "@/hooks/api";
import { useTranslation } from "@/i18n/client";
import { readStashedCheckout, trackPurchase } from "@/lib/observability/analytics";

const CONFETTI_COLORS = ["#8b2942", "#c45c7a", "#1a1a1a"] as const;

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 13 + 5) % 96}%`,
  delay: `${((i * 0.31) % 2.8).toFixed(2)}s`,
  duration: `${(2.8 + (i % 5) * 0.45).toFixed(2)}s`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 4 + (i % 4),
  round: i % 2 === 0,
}));

function CelebrationBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        borderRadius: "inherit",
        pointerEvents: "none",
        "@keyframes celebrateGlow": {
          "0%": { opacity: 0.55, transform: "scale(1) rotate(0deg)" },
          "100%": { opacity: 1, transform: "scale(1.08) rotate(2deg)" },
        },
        "@keyframes confettiFall": {
          "0%": { transform: "translateY(-12px) rotate(0deg)", opacity: 0 },
          "12%": { opacity: 0.55 },
          "100%": { transform: "translateY(440px) rotate(540deg)", opacity: 0 },
        },
        "@keyframes sparkleDrift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: 0.25 },
          "50%": { transform: "translate(8px, -10px) scale(1.15)", opacity: 0.5 },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& .celebrate-motion": { animation: "none !important" },
        },
      }}
    >
      <Box
        className="celebrate-motion"
        sx={{
          position: "absolute",
          inset: "-25%",
          background:
            "radial-gradient(circle at 25% 15%, rgba(196, 92, 122, 0.18), transparent 42%), radial-gradient(circle at 75% 85%, rgba(139, 41, 66, 0.14), transparent 38%), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.65), transparent 55%)",
          animation: "celebrateGlow 7s ease-in-out infinite alternate",
        }}
      />
      {CONFETTI.map((piece,i) => (
        <Box
          key={`${piece.left}${i}`}
          className="celebrate-motion"
          sx={{
            position: "absolute",
            left: piece.left,
            top: -8,
            width: piece.size,
            height: piece.size * 1.35,
            borderRadius: piece.round ? "50%" : "1px",
            bgcolor: piece.color,
            opacity: 0.4,
            animation: `confettiFall ${piece.duration} linear ${piece.delay} infinite`,
          }}
        />
      ))}
      {[12, 28, 44, 62, 78].map((left, i) => (
        <Box
          key={`sparkle-${left}`}
          className="celebrate-motion"
          sx={{
            position: "absolute",
            left: `${left}%`,
            top: `${18 + i * 14}%`,
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: i % 2 === 0 ? "secondary.main" : "secondary.light",
            opacity: 0.35,
            animation: `sparkleDrift ${3 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
          }}
        />
      ))}
    </Box>
  );
}

function SuccessStep({
  icon,
  text,
}: Readonly<{
  icon: ReactNode;
  text: string;
}>) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", textAlign: "left" }}>
      <Box
        sx={{
          mt: 0.25,
          width: 36,
          height: 36,
          borderRadius: "50%",
          bgcolor: "grey.100",
          color: "text.secondary",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, pt: 0.75 }}>
        {text}
      </Typography>
    </Stack>
  );
}

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
    <Box
      sx={{
        minHeight: { xs: "calc(100vh - 120px)", md: "calc(100vh - 140px)" },
        display: "flex",
        alignItems: "center",
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 3, sm: 4.5 },
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <CelebrationBackground />

          <Stack spacing={3} sx={{ position: "relative", zIndex: 1, alignItems: "center" }}>
            <YCompanyLogo variant="mark" color="dark" height={44} />

            <Box sx={{ maxWidth: 420 }}>
              <Typography variant="h1" sx={{ fontSize: { xs: "1.625rem", sm: "1.875rem" }, mb: 1 }}>
                {t("checkoutSuccess.title")}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {t("checkoutSuccess.body")}
              </Typography>
            </Box>

            <Box sx={{ width: "100%", maxWidth: 400 }}>
              <Divider sx={{ mb: 2.5, borderColor: "rgba(0,0,0,0.06)" }} />
              <Stack spacing={2}>
                <SuccessStep
                  icon={<EmailOutlinedIcon fontSize="small" />}
                  text={t("checkoutSuccess.stepEmail")}
                />
                <SuccessStep
                  icon={<ReceiptLongOutlinedIcon fontSize="small" />}
                  text={t("checkoutSuccess.stepAccount")}
                />
              </Stack>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ width: "100%", maxWidth: 420, pt: 0.5 }}
            >
              <Button component={Link} href="/account" variant="contained" fullWidth size="large">
                {t("checkoutSuccess.viewOrders")}
              </Button>
              <Button component={Link} href="/products" variant="outlined" fullWidth size="large">
                {t("common.continueShopping")}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

function SuccessFallback() {
  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="sm">
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Skeleton variant="rounded" width={44} height={44} />
            <Skeleton variant="text" width="60%" height={36} />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="rounded" width="100%" height={48} />
            <Skeleton variant="rounded" width="100%" height={48} />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessInner />
    </Suspense>
  );
}

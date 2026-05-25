"use client";

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import { SignOutButton } from "@/components/SignOutButton";
import { useCancelOrder, useOrders } from "@/hooks/api";
import { useTranslation } from "@/i18n/client";
import { formatPrice } from "@/lib/product-filters";
import { trackCancelOrder } from "@/lib/observability/analytics";
import type { Order } from "@/types/order";
import { canCancelOrder, orderStatusLabel } from "@/types/order";

const MONTH_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function statusColor(
  status: Order["status"],
): "default" | "primary" | "success" | "error" | "warning" {
  switch (status) {
    case "processing":
      return "warning";
    case "shipped":
      return "primary";
    case "delivered":
      return "success";
    case "cancelled":
      return "default";
    default:
      return "default";
  }
}

function formatPlacedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Shared column widths: item | middle (qty / year) | right (price / month). */
const COL_MID = 110;
const COL_PRICE = 120;
const filterToolbarWidth = COL_MID + COL_PRICE + 16;
const tableGridColumns = `minmax(0, 1fr) ${COL_MID}px ${COL_PRICE}px`;

const tableCellSx = {
  py: 1,
  px: 2,
  borderBottom: 1,
  borderColor: "divider",
  verticalAlign: "middle" as const,
};

const headerButtonSx = {
  minHeight: 40,
  height: 40,
  whiteSpace: "nowrap",
  px: 2.5,
  flexShrink: 0,
  width: { xs: "100%", sm: "auto" },
};

type Props = {
  email: string;
  name?: string | null;
};

export function AccountDashboard({ email, name }: Props) {
  const { t } = useTranslation();
  const { orders, isPending: loading, errorMessage: loadError } = useOrders();
  const {
    cancelOrder,
    isPending: cancelling,
    errorMessage: cancelError,
    reset: resetCancel,
  } = useCancelOrder();
  const [year, setYear] = useState<number | "all">("all");
  const [month, setMonth] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [dismissedError, setDismissedError] = useState(false);

  const error =
    !dismissedError && (cancelError ?? loadError) ? cancelError ?? loadError : null;

  const monthLabel = useCallback(
    (value: number) => (value === 0 ? t("common.allMonths") : t(`months.${value}`)),
    [t],
  );

  const years = useMemo(() => {
    const set = new Set(orders.map((o) => new Date(o.placedAt).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.placedAt);
      if (year !== "all" && d.getFullYear() !== year) return false;
      if (month > 0 && d.getMonth() + 1 !== month) return false;
      return true;
    });
  }, [orders, year, month]);

  const stats = useMemo(() => {
    const active = filtered.filter((o) => o.status !== "cancelled");
    return {
      count: filtered.length,
      spentCents: active.reduce((s, o) => s + o.totalCents, 0),
      cancellable: filtered.filter((o) => canCancelOrder(o)).length,
    };
  }, [filtered]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setDismissedError(false);
    try {
      await cancelOrder({ orderId: cancelTarget.id });
      trackCancelOrder(cancelTarget.id);
      setCancelTarget(null);
      resetCancel();
    } catch {
      // Error surfaced via cancelError
    }
  };

  const closeCancelDialog = () => {
    if (!cancelling) {
      setCancelTarget(null);
      resetCancel();
    }
  };

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) auto",
            },
            columnGap: 2,
            rowGap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h1" sx={{ fontSize: "2rem", mb: 0.5 }}>
              {t("account.myAccount")}
            </Typography>
            <Typography color="text.secondary">
              {name ? `${name} · ` : ""}
              {email}
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              justifySelf: { md: "end" },
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <ButtonLink href="/products" variant="outlined" sx={headerButtonSx}>
              {t("common.continueShopping")}
            </ButtonLink>
            <SignOutButton fullWidth={false} sx={headerButtonSx} />
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: `minmax(0, 1fr) ${filterToolbarWidth}px`,
            },
            columnGap: 2,
            rowGap: 2,
            alignItems: "start",
            mb: 2,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 1,
              gridColumn: { xs: "1", md: "1" },
            }}
          >
            <ShoppingBagOutlinedIcon fontSize="small" />
            {t("account.orderHistory")}
          </Typography>
            <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `${COL_MID}px ${COL_PRICE}px`,
              columnGap: 2,
              width: filterToolbarWidth,
              justifySelf: { xs: "stretch", md: "end" },
            }}
          >
            <FormControl size="small" sx={{ width: "100%" }}>
              <InputLabel id="year-filter">{t("common.year")}</InputLabel>
              <Select
                labelId="year-filter"
                label={t("common.year")}
                value={year === "all" ? "all" : String(year)}
                onChange={(e) => {
                  const v = e.target.value;
                  setYear(v === "all" ? "all" : Number.parseInt(v, 10));
                }}
              >
                <MenuItem value="all">{t("common.allYears")}</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y} value={String(y)}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: "100%" }}>
              <InputLabel id="month-filter">{t("common.month")}</InputLabel>
              <Select
                labelId="month-filter"
                label={t("common.month")}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTH_VALUES.map((m) => (
                  <MenuItem key={m} value={m}>
                    {monthLabel(m)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Stack sx={{ mb: 2, flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
          <Chip label={t("account.ordersCount", { count: stats.count })} size="small" />
          <Chip
            label={t("account.spent", { amount: formatPrice(stats.spentCents) })}
            size="small"
            color="primary"
            variant="outlined"
          />
          {stats.cancellable > 0 && (
            <Chip
              label={t("account.cancellable", { count: stats.cancellable })}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setDismissedError(true)}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {t("account.noOrders")}
            </Typography>
            <ButtonLink href="/products" variant="contained">
              {t("common.browseShop")}
            </ButtonLink>
          </Box>
        ) : (
          <Stack spacing={2}>
            {filtered.map((order) => (
              <Paper key={order.id} variant="outlined" sx={{ overflow: "hidden", borderRadius: 2 }}>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: "action.hover",
                    display: "grid",
                    gridTemplateColumns: tableGridColumns,
                    columnGap: 2,
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {t("account.orderId", {
                        id: order.id.replace("ord_", "#").slice(0, 16),
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("account.placed", { date: formatPlacedAt(order.placedAt) })}
                      {order.cancelledAt
                        ? t("account.cancelledOn", {
                            date: formatPlacedAt(order.cancelledAt),
                          })
                        : ""}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Chip
                      label={orderStatusLabel(order.status)}
                      size="small"
                      color={statusColor(order.status)}
                    />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, textAlign: "right" }}
                  >
                    {formatPrice(order.totalCents, order.currency.toUpperCase())}
                  </Typography>
                </Box>
                <Box sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: tableGridColumns,
                      columnGap: 2,
                      bgcolor: "background.paper",
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2" sx={{ ...tableCellSx, fontWeight: 600 }}>
                      {t("common.item")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ ...tableCellSx, fontWeight: 600, textAlign: "right" }}
                    >
                      {t("common.qty")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ ...tableCellSx, fontWeight: 600, textAlign: "right" }}
                    >
                      {t("common.price")}
                    </Typography>
                  </Box>
                  {order.lines.map((line) => (
                    <Box
                      key={`${order.id}-${line.productId}`}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: tableGridColumns,
                        columnGap: 2,
                        borderBottom: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="body2" sx={{ ...tableCellSx }}>
                        {line.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ ...tableCellSx, textAlign: "right" }}
                      >
                        {line.quantity}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ ...tableCellSx, textAlign: "right" }}
                      >
                        {formatPrice(line.unitPriceCents * line.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                {canCancelOrder(order) && (
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderTop: 1,
                      borderColor: "divider",
                      display: "grid",
                      gridTemplateColumns: tableGridColumns,
                      columnGap: 2,
                    }}
                  >
                    <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<CancelOutlinedIcon />}
                        onClick={() => {
                          setDismissedError(false);
                          setCancelTarget(order);
                        }}
                        sx={headerButtonSx}
                      >
                        {t("account.cancelOrder")}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={Boolean(cancelTarget)} onClose={closeCancelDialog}>
        <DialogTitle>{t("account.cancelDialogTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t("account.cancelDialogBody")}
          </Typography>
          {cancelTarget && (
            <Typography sx={{ mt: 2, fontWeight: 600 }}>
              {formatPrice(cancelTarget.totalCents)} · {formatPlacedAt(cancelTarget.placedAt)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} disabled={cancelling}>
            {t("account.keepOrder")}
          </Button>
          <Button color="error" variant="contained" onClick={() => void confirmCancel()} disabled={cancelling}>
            {cancelling ? t("account.cancelling") : t("account.confirmCancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

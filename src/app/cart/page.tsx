"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CouponField } from "@/components/CouponField";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/i18n/client";
import { computeCartTotals, formatMoney } from "@/lib/cart-totals";

export default function CartPage() {
  const { t } = useTranslation();
  const { lines, setQty, remove, clear } = useCart();
  const [coupon, setCoupon] = useState("");

  const totals = useMemo(() => computeCartTotals(lines, coupon), [lines, coupon]);
  const { rows } = totals;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h1" sx={{ fontSize: "2rem", mb: 2 }}>
        {t("cart.title")}
      </Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("cart.empty")}{" "}
          <Button component={Link} href="/products">
            {t("common.continueShopping")}
          </Button>
        </Typography>
      ) : (
        <>
          <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" }, mb: 3 }}>
            {rows.map(({ productId, quantity, product, lineTotalCents }) => (
              <Paper key={productId} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  <Button
                    component={Link}
                    href={`/products/${product.slug}`}
                    sx={{ justifyContent: "flex-start", textAlign: "left", p: 0 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                  </Button>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography color="text.secondary">{t("common.price")}</Typography>
                    <Typography>
                      {formatMoney(product.priceCents, product.currency.toUpperCase())}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <TextField
                      type="number"
                      size="small"
                      label={t("common.qty")}
                      value={quantity}
                      onChange={(e) =>
                        setQty(productId, Number.parseInt(e.target.value, 10) || 0)
                      }
                      slotProps={{
                        input: { inputProps: { min: 1, max: 99 } },
                      }}
                      sx={{ width: 100 }}
                    />
                    <Typography sx={{ fontWeight: 600 }}>
                      {formatMoney(lineTotalCents, product.currency.toUpperCase())}
                    </Typography>
                    <IconButton
                      aria-label={t("cart.removeAria")}
                      onClick={() => remove(productId)}
                      size="small"
                    >
                      <DeleteOutlinedIcon />
                    </IconButton>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Paper
            variant="outlined"
            sx={{ mb: 3, overflow: "hidden", display: { xs: "none", md: "block" } }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("cart.product")}</TableCell>
                  <TableCell align="right">{t("common.price")}</TableCell>
                  <TableCell align="center">{t("common.qty")}</TableCell>
                  <TableCell align="right">{t("cart.line")}</TableCell>
                  <TableCell align="right" width={56} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ productId, quantity, product, lineTotalCents }) => (
                  <TableRow key={productId}>
                    <TableCell>
                      <Button component={Link} href={`/products/${product.slug}`}>
                        {product.name}
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      {formatMoney(product.priceCents, product.currency.toUpperCase())}
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={quantity}
                        onChange={(e) =>
                          setQty(productId, Number.parseInt(e.target.value, 10) || 0)
                        }
                        slotProps={{
                          input: {
                            inputProps: { min: 1, max: 99 },
                          },
                        }}
                        sx={{ width: 88 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatMoney(lineTotalCents, product.currency.toUpperCase())}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={t("cart.removeAria")}
                        onClick={() => remove(productId)}
                        size="small"
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, maxWidth: 440, ml: { md: "auto" } }}>
            <CouponField
              value={coupon}
              onChange={setCoupon}
              subtotalCents={totals.subtotalCents}
            />
            <Stack spacing={1} sx={{ mt: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>{t("common.subtotal")}</Typography>
                <Typography>{formatMoney(totals.subtotalCents)}</Typography>
              </Box>
              {totals.discountCents > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>{t("common.discount")}</Typography>
                  <Typography color="success.main">
                    −{formatMoney(totals.discountCents)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>{t("common.shipping")}</Typography>
                <Typography>{formatMoney(totals.shippingCents)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
                <Typography variant="h6">{t("common.estimatedTotal")}</Typography>
                <Typography variant="h6">{formatMoney(totals.totalCents)}</Typography>
              </Box>
            </Stack>
            <Stack
              spacing={2}
              sx={{
                mt: 3,
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <Button
                component={Link}
                href={coupon.trim() ? `/checkout?coupon=${encodeURIComponent(coupon.trim())}` : "/checkout"}
                variant="contained"
                fullWidth
                sx={{ minHeight: 48 }}
              >
                {t("cart.proceedCheckout")}
              </Button>
              <Button color="inherit" onClick={() => clear()}>
                {t("cart.clearCart")}
              </Button>
            </Stack>
          </Paper>
        </>
      )}
    </Container>
  );
}

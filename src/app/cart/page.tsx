"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import { CartQuantityStepper } from "@/components/CartQuantityStepper";
import { CouponField } from "@/components/CouponField";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";
import { useTranslation } from "@/i18n/client";
import { computeCartTotals, formatMoney } from "@/lib/cart-totals";
import type { Product } from "@/types/product";

const suggestedProducts = products.slice(0, 3);

function CartLineImage({ product, size = 88 }: Readonly<{ product: Product; size?: number }>) {
  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "grey.100",
        flexShrink: 0,
      }}
    >
      <Image
        src={product.image}
        alt=""
        fill
        sizes={`${size}px`}
        style={{ objectFit: "cover" }}
      />
    </Box>
  );
}

function CartEmptyState() {
  const { t } = useTranslation();

  return (
    <Stack spacing={{ xs: 4, md: 5 }}>
      <Paper
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          px: { xs: 3, sm: 4 },
          py: { xs: 5, sm: 6 },
          textAlign: "center",
          background:
            "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(246,244,241,0.95) 100%)",
        }}
      >
        <Box
          sx={{
            mx: "auto",
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: "50%",
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
          }}
        >
          <ShoppingBagOutlinedIcon sx={{ fontSize: 40, color: "secondary.main" }} />
        </Box>
        <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, mb: 1.5 }}>
          {t("cart.emptyTitle")}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 480, mx: "auto", lineHeight: 1.7, mb: 3 }}
        >
          {t("cart.emptyBody")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: 2, sm: 3 },
            maxWidth: 560,
            mx: "auto",
          }}
        >
          <ButtonLink
            href="/products"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{ minHeight: 48, px: 3 }}
          >
            {t("home.shopCollection")}
          </ButtonLink>
          <ButtonLink
            href="/search"
            variant="outlined"
            size="large"
            startIcon={<SearchIcon />}
            sx={{ minHeight: 48, px: 3 }}
          >
            {t("cart.searchCatalog")}
          </ButtonLink>
        </Box>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: { xs: 2, md: 3 } }}>
          {t("cart.youMightLike")}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {suggestedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Box>
      </Box>
    </Stack>
  );
}

export default function CartPage() {
  const { t } = useTranslation();
  const { lines, remove, clear } = useCart();
  const [coupon, setCoupon] = useState("");

  const totals = useMemo(() => computeCartTotals(lines, coupon), [lines, coupon]);
  const { rows } = totals;
  const itemCount = rows.reduce((sum, row) => sum + row.quantity, 0);
  const checkoutHref = coupon.trim()
    ? `/checkout?coupon=${encodeURIComponent(coupon.trim())}`
    : "/checkout";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack
        spacing={{ xs: 1, md: 1.5 }}
        sx={{
          mb: { xs: 4, md: 5 },
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "flex-end" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2rem" } }}>
            {t("cart.title")}
          </Typography>
          {rows.length > 0 ? (
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {itemCount === 1
                ? t("cart.itemCount", { count: itemCount })
                : t("cart.itemCountPlural", { count: itemCount })}
            </Typography>
          ) : null}
        </Box>
        {rows.length > 0 ? (
          <ButtonLink href="/products" variant="text" sx={{ px: 0, minHeight: 40 }}>
            {t("cart.continueShoppingHint")} {t("common.continueShopping")}
          </ButtonLink>
        ) : null}
      </Stack>

      {rows.length === 0 ? (
        <CartEmptyState />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
            alignItems: "start",
          }}
        >
          <Stack spacing={2}>
            <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
              {rows.map(({ productId, product, lineTotalCents }) => (
                <Paper key={productId} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Link href={`/products/${product.slug}`} style={{ lineHeight: 0 }}>
                      <CartLineImage product={product} />
                    </Link>
                    <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                      <Box>
                        <Button
                          component={Link}
                          href={`/products/${product.slug}`}
                          sx={{ justifyContent: "flex-start", textAlign: "left", p: 0, mb: 0.5 }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {product.name}
                          </Typography>
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                          {formatMoney(product.priceCents, product.currency.toUpperCase())}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <CartQuantityStepper productId={productId} size="small" />
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
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Paper
              variant="outlined"
              sx={{ overflow: "hidden", display: { xs: "none", md: "block" }, borderRadius: 2 }}
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
                  {rows.map(({ productId, product, lineTotalCents }) => (
                    <TableRow key={productId} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                          <Link href={`/products/${product.slug}`} style={{ lineHeight: 0 }}>
                            <CartLineImage product={product} size={72} />
                          </Link>
                          <Button component={Link} href={`/products/${product.slug}`}>
                            {product.name}
                          </Button>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        {formatMoney(product.priceCents, product.currency.toUpperCase())}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "inline-flex", justifyContent: "center" }}>
                          <CartQuantityStepper productId={productId} size="small" />
                        </Box>
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
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 2,
              position: { lg: "sticky" },
              top: { lg: 88 },
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("common.estimatedTotal")}
            </Typography>
            <CouponField
              value={coupon}
              onChange={setCoupon}
              subtotalCents={totals.subtotalCents}
            />
            <Stack spacing={1.25} sx={{ mt: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography color="text.secondary">{t("common.subtotal")}</Typography>
                <Typography>{formatMoney(totals.subtotalCents)}</Typography>
              </Box>
              {totals.discountCents > 0 ? (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">{t("common.discount")}</Typography>
                  <Typography color="success.main">
                    −{formatMoney(totals.discountCents)}
                  </Typography>
                </Box>
              ) : null}
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography color="text.secondary">{t("common.shipping")}</Typography>
                <Typography>{formatMoney(totals.shippingCents)}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">{t("common.estimatedTotal")}</Typography>
                <Typography variant="h6">{formatMoney(totals.totalCents)}</Typography>
              </Box>
            </Stack>
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <ButtonLink
                href={checkoutHref}
                variant="contained"
                fullWidth
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ minHeight: 48 }}
              >
                {t("cart.proceedCheckout")}
              </ButtonLink>
              <Button color="inherit" onClick={() => clear()} sx={{ minHeight: 44 }}>
                {t("cart.clearCart")}
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </Container>
  );
}

"use client";

import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { memo, useCallback } from "react";
import type { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/i18n/client";
import { getStockStatus } from "@/lib/inventory";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: theme.transitions.create("box-shadow"),
  "&:hover": {
    boxShadow: theme.shadows[8],
  },
}));

type Props = { product: Product; priority?: boolean };

function ProductCardInner({ product, priority = false }: Props) {
  const { t } = useTranslation();
  const { add } = useCart();
  const stockStatus = getStockStatus(product);
  const outOfStock = stockStatus === "out_of_stock";

  const onAdd = useCallback(() => {
    if (!outOfStock) add(product.id, 1);
  }, [add, outOfStock, product.id]);

  return (
    <StyledCard variant="outlined">
      <Link href={`/products/${product.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
        <Box sx={{ position: "relative", height: 220, width: "100%", bgcolor: "grey.100" }}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 280px"
            style={{ objectFit: "cover" }}
            priority={priority}
          />
          {stockStatus === "low_stock" && (
            <Chip
              label={t("products.lowStock")}
              size="small"
              color="warning"
              sx={{ position: "absolute", top: 8, left: 8 }}
            />
          )}
          {outOfStock && (
            <Chip
              label={t("products.outOfStock")}
              size="small"
              sx={{ position: "absolute", top: 8, left: 8 }}
            />
          )}
        </Box>
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="overline" color="text.secondary">
            {product.brand} · {product.category}
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {(product.priceCents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: product.currency.toUpperCase(),
            })}
          </Typography>
        </CardContent>
      </Link>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<AddShoppingCartOutlinedIcon />}
          onClick={onAdd}
          disabled={outOfStock}
        >
          {outOfStock ? t("products.outOfStock") : t("products.addToCart")}
        </Button>
      </CardActions>
    </StyledCard>
  );
}

export const ProductCard = memo(ProductCardInner);

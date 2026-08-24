"use client";

import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import type { Product } from "@/types/product";
import { CartQuantityStepper } from "@/components/CartQuantityStepper";
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
  const stockStatus = getStockStatus(product);
  const outOfStock = stockStatus === "out_of_stock";

  return (
    <StyledCard variant="outlined">
      <Link
        href={`/products/${product.slug}`}
        style={{
          textDecoration: "none",
          color: "inherit",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
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
        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            px: 2.5,
            pt: 2.5,
            pb: 1.5,
            "&:last-child": { pb: 1.5 },
          }}
        >
          <Typography variant="overline" color="text.secondary">
            {product.brand} · {product.category}
          </Typography>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              flex: 1,
              minHeight: "3.25rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mt: 0.5,
            }}
          >
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
            {(product.priceCents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: product.currency.toUpperCase(),
            })}
          </Typography>
        </CardContent>
      </Link>
      <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, mt: "auto" }}>
        <CartQuantityStepper productId={product.id} size="small" fullWidth />
      </CardActions>
    </StyledCard>
  );
}

export const ProductCard = memo(ProductCardInner);

"use client";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, IconButton, Typography } from "@mui/material";
import { useMemo } from "react";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/i18n/client";
import { getStockStatus } from "@/lib/inventory";

type StepperSize = "small" | "medium" | "large";

type Props = {
  productId: string;
  size?: StepperSize;
  fullWidth?: boolean;
};

const sizeConfig: Record<
  StepperSize,
  { height: number; minWidth: number; fontSize: string; iconSize: "small" | "medium" | "large" }
> = {
  small: { height: 40, minWidth: 120, fontSize: "0.9375rem", iconSize: "small" },
  medium: { height: 44, minWidth: 132, fontSize: "1rem", iconSize: "medium" },
  large: { height: 48, minWidth: 148, fontSize: "1.0625rem", iconSize: "large" },
};

export function CartQuantityStepper({
  productId,
  size = "medium",
  fullWidth = false,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const { lines, add, setQty } = useCart();
  const product = products.find((p) => p.id === productId);
  const quantity = useMemo(
    () => lines.find((line) => line.productId === productId)?.quantity ?? 0,
    [lines, productId],
  );

  const outOfStock = !product || getStockStatus(product) === "out_of_stock";
  const atMax = product ? quantity >= product.stock : true;
  const config = sizeConfig[size];

  const onIncrease = () => {
    if (!product || outOfStock || atMax) return;
    add(productId, 1);
  };

  const onDecrease = () => {
    if (quantity <= 0) return;
    setQty(productId, quantity - 1);
  };

  if (outOfStock) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: fullWidth ? "100%" : "auto",
          minWidth: fullWidth ? undefined : config.minWidth,
          height: config.height,
          px: 2,
          borderRadius: 999,
          border: 1,
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t("products.outOfStock")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      role="group"
      aria-label={t("cart.quantityAria", { name: product.name })}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        width: fullWidth ? "100%" : "auto",
        minWidth: config.minWidth,
        height: config.height,
        border: 1,
        borderColor: "divider",
        borderRadius: 999,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <IconButton
        onClick={onDecrease}
        disabled={quantity <= 0}
        aria-label={t("cart.decreaseQtyAria")}
        size={config.iconSize}
        sx={{
          borderRadius: 0,
          width: config.height,
          height: config.height,
          flexShrink: 0,
        }}
      >
        <RemoveIcon fontSize={config.iconSize} />
      </IconButton>
      <Typography
        component="span"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${t("common.qty")}: ${quantity}`}
        sx={{
          flex: 1,
          textAlign: "center",
          fontWeight: 600,
          fontSize: config.fontSize,
          lineHeight: 1,
          userSelect: "none",
          minWidth: 28,
        }}
      >
        {quantity}
      </Typography>
      <IconButton
        onClick={onIncrease}
        disabled={atMax}
        aria-label={t("cart.increaseQtyAria")}
        size={config.iconSize}
        sx={{
          borderRadius: 0,
          width: config.height,
          height: config.height,
          flexShrink: 0,
        }}
      >
        <AddIcon fontSize={config.iconSize} />
      </IconButton>
    </Box>
  );
}

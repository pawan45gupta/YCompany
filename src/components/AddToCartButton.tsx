"use client";

import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import { Button } from "@mui/material";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/i18n/client";
import { getStockStatus } from "@/lib/inventory";

export function AddToCartButton({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const { add } = useCart();
  const product = products.find((p) => p.id === productId);
  const outOfStock = product ? getStockStatus(product) === "out_of_stock" : true;

  return (
    <Button
      variant="contained"
      size="large"
      startIcon={<AddShoppingCartOutlinedIcon />}
      onClick={() => add(productId, 1)}
      disabled={outOfStock}
    >
      {outOfStock ? t("products.outOfStock") : t("products.addToCart")}
    </Button>
  );
}

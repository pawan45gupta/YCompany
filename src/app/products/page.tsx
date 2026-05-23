import { Container, Typography } from "@mui/material";
import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.products.title,
  description: dict.products.metaDescription,
};

export default function ProductsPage() {
  const { t } = getTranslations();
  const brandCount = new Set(products.map((p) => p.brand)).size;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h1" sx={{ fontSize: "2rem", mb: 1 }}>
        {t("products.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {t("products.catalogSummary", { count: products.length, brands: brandCount })}
      </Typography>
      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Container>
  );
}

import { Box, Container, Stack, Typography } from "@mui/material";
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
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2rem" } }}>
          {t("products.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
          {t("products.catalogSummary", { count: products.length, brands: brandCount })}
        </Typography>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 3, sm: 3.5, md: 4 },
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(auto-fill, minmax(260px, 1fr))",
          },
        }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Box>
    </Container>
  );
}

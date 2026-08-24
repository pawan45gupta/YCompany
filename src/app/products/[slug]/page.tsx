import { Box, Breadcrumbs, Container, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductViewTracker } from "@/components/observability/ProductViewTracker";
import { getProductBySlug, products } from "@/data/products";
import { getTranslations } from "@/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  const { t } = getTranslations();
  if (!product) return { title: t("common.product") };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const { t } = getTranslations();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency.toUpperCase(),
      price: (product.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <ProductViewTracker product={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs sx={{ mb: { xs: 3, md: 4 } }}>
        <Link href="/products" style={{ color: "inherit", textDecoration: "underline" }}>
          {t("common.shop")}
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 4, md: 6 }}
        sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: { xs: "100%", md: 480 },
            flex: { md: "0 0 auto" },
            aspectRatio: "4/5",
            bgcolor: "grey.100",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 900px) 100vw, 480px"
            style={{ objectFit: "cover" }}
            priority
          />
        </Box>
        <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ flex: 1, minWidth: 0, maxWidth: 560, pt: { md: 0.5 } }}>
          <Typography variant="overline" color="text.secondary">
            {product.brand} · {product.category}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
            {product.name}
          </Typography>
          <Typography variant="h5" component="p">
            {(product.priceCents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: product.currency.toUpperCase(),
            })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {product.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("products.tags", { tags: product.tags.join(", ") })}
          </Typography>
          <Box sx={{ pt: { xs: 1, md: 1.5 } }}>
            <AddToCartButton productId={product.id} />
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}

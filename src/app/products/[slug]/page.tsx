import { Box, Breadcrumbs, Container, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
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
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/products" style={{ color: "inherit", textDecoration: "underline" }}>
          {t("common.shop")}
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>
      <Stack
        spacing={4}
        sx={{
          flexDirection: { xs: "column", md: "row" },
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 480,
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
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="text.secondary">
            {product.brand} · {product.category}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, mb: 2 }}>
            {product.name}
          </Typography>
          <Typography variant="h5" component="p" sx={{ mb: 3 }}>
            {(product.priceCents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: product.currency.toUpperCase(),
            })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 560 }}>
            {product.description}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("products.tags", { tags: product.tags.join(", ") })}
          </Typography>
          <AddToCartButton productId={product.id} />
        </Box>
      </Stack>
    </Container>
  );
}

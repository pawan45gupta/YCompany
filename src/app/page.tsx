import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Chip, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { ButtonLink } from "@/components/ButtonLink";
import { ProductCard } from "@/components/ProductCard";
import { products, specialtyCollections } from "@/data/products";
import { getTranslations } from "@/i18n/server";

export default function HomePage() {
  const { t } = getTranslations();
  const featured = products.slice(0, 3);

  return (
    <>
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ maxWidth: 720 }}>
            <Typography variant="overline" sx={{ opacity: 0.85 }}>
              {t("home.newSeason")}
            </Typography>
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: "2.25rem", md: "3.25rem" } }}>
              {t("home.headline")}
            </Typography>
            <Typography variant="h6" component="p" sx={{ fontWeight: 400, opacity: 0.92, lineHeight: 1.6 }}>
              {t("home.subhead")}
            </Typography>
            <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
              {specialtyCollections.map((item) => (
                <Link
                  key={item.slug}
                  href={`/search?q=${encodeURIComponent(item.query)}`}
                  style={{ textDecoration: "none" }}
                >
                  <Chip
                    label={t(item.labelKey)}
                    clickable
                    variant="outlined"
                    sx={{
                      borderColor: "rgba(255,255,255,0.55)",
                      color: "#fff",
                      "& .MuiChip-label": {
                        color: "#fff",
                      },
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.12)",
                        borderColor: "rgba(255,255,255,0.85)",
                      },
                    }}
                  />
                </Link>
              ))}
            </Stack>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <ButtonLink
                href="/products"
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: "secondary.contrastText",
                  minHeight: 48,
                  height: 48,
                  px: 3,
                }}
              >
                {t("home.shopCollection")}
              </ButtonLink>
              <ButtonLink
                href="/search"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: "rgba(255,255,255,0.6)",
                  color: "inherit",
                  minHeight: 48,
                  height: 48,
                  px: 3,
                }}
              >
                {t("home.searchProducts")}
              </ButtonLink>
            </Box>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant="h4" component="h2">
            {t("home.featured")}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            {t("home.featuredBody")}
          </Typography>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, sm: 3.5, md: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {featured.map((p, index) => (
            <ProductCard key={p.id} product={p} priority={index === 0} />
          ))}
        </Box>
      </Container>
    </>
  );
}

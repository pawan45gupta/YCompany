import { Container, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.about.title,
  description: dict.about.metaDescription,
};

export default function AboutPage() {
  const { t } = getTranslations();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={{ xs: 3, md: 4 }}>
        <Stack spacing={{ xs: 1.5, md: 2 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", md: "2rem" } }}>
            {t("about.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.7 }}>
            {t("about.intro")}
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Typography variant="h2" sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
            {t("about.heritageTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t("about.heritageBody")}
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Typography variant="h2" sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
            {t("about.craftTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t("about.craftBody")}
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Typography variant="h2" sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
            {t("about.promiseTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {t("about.promiseBody")}
          </Typography>
        </Stack>
      </Stack>
    </Container>
  );
}

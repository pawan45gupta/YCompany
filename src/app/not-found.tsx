import { Button, Container, Typography } from "@mui/material";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "@/i18n/server";

const { dict, t } = getTranslations();

export const metadata: Metadata = {
  title: dict.notFound.title,
};

export default function NotFoundPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
      <Typography variant="h1" sx={{ fontSize: "1.75rem", mb: 1 }}>
        {t("notFound.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("notFound.body")}
      </Typography>
      <Link href="/" style={{ textDecoration: "none" }}>
        <Button variant="contained">{t("notFound.home")}</Button>
      </Link>
    </Container>
  );
}

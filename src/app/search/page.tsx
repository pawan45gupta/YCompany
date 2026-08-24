import { Container } from "@mui/material";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { SearchPageSkeleton } from "@/components/AppLoader";
import { getTranslations } from "@/i18n/server";

const SearchClient = dynamic(
  () => import("./SearchClient").then((m) => ({ default: m.SearchClient })),
  { loading: () => <SearchFallback /> },
);

const { dict, t } = getTranslations();

export const metadata: Metadata = {
  title: dict.search.title,
  description: dict.search.metaDescription,
};

function SearchFallback() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <SearchPageSkeleton label={t("common.loading")} />
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  );
}

import { Container, Skeleton, Stack } from "@mui/material";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getTranslations } from "@/i18n/server";

const SearchClient = dynamic(
  () => import("./SearchClient").then((m) => ({ default: m.SearchClient })),
  { loading: () => <SearchFallback /> },
);

const { dict } = getTranslations();

export const metadata: Metadata = {
  title: dict.search.title,
  description: dict.search.metaDescription,
};

function SearchFallback() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={2}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={280} />
      </Stack>
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

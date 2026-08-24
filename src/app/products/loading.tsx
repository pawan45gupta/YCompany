import { Container, Skeleton, Stack } from "@mui/material";
import { ProductGridSkeleton, shimmerPlaceholderSx } from "@/components/AppLoader";

export default function ProductsLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Skeleton variant="text" width={180} height={48} sx={shimmerPlaceholderSx} />
        <Skeleton variant="text" width="60%" sx={shimmerPlaceholderSx} />
      </Stack>
      <ProductGridSkeleton />
    </Container>
  );
}

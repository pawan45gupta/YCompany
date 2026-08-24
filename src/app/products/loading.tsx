import { Container, Skeleton, Stack } from "@mui/material";
import { ProductGridSkeleton, shimmerPlaceholderSx } from "@/components/AppLoader";

export default function ProductsLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={2} sx={{ mb: 4 }}>
        <Skeleton variant="text" width={180} height={48} sx={shimmerPlaceholderSx} />
        <Skeleton variant="text" width="60%" sx={shimmerPlaceholderSx} />
      </Stack>
      <ProductGridSkeleton />
    </Container>
  );
}

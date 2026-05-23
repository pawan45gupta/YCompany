import { Box, Container, Skeleton, Stack } from "@mui/material";

export default function ProductsLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={2} sx={{ mb: 4 }}>
        <Skeleton variant="text" width={180} height={48} />
        <Skeleton variant="text" width="60%" />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={360} />
        ))}
      </Box>
    </Container>
  );
}

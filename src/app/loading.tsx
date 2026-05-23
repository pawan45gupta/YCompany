import { Container, LinearProgress, Stack, Typography } from "@mui/material";
import { getTranslations } from "@/i18n/server";

export default function Loading() {
  const { t } = getTranslations();
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Stack spacing={2} sx={{ maxWidth: 360 }}>
        <LinearProgress />
        <Typography color="text.secondary">{t("common.loading")}</Typography>
      </Stack>
    </Container>
  );
}

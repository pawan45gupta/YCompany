"use client";

import { Box, Container, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";

const footerLinkSx = {
  display: "inline-flex",
  alignItems: "center",
  lineHeight: 1.43,
  flexShrink: 0,
} as const;

export function Footer() {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 4,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.43, maxWidth: { xs: "100%", sm: "none" } }}
          >
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </Typography>
          <Box
            component="nav"
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <MuiLink
              component={Link}
              href="/products"
              color="inherit"
              variant="body2"
              underline="hover"
              sx={footerLinkSx}
            >
              {t("common.catalog")}
            </MuiLink>
            <MuiLink
              component={Link}
              href="/about"
              color="inherit"
              variant="body2"
              underline="hover"
              sx={footerLinkSx}
            >
              {t("common.aboutUs")}
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

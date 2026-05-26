"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { YCompanyLogo } from "@/components/YCompanyLogo";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Optional row rendered below the form (links, secondary actions). */
  footer?: ReactNode;
};

/**
 * Centered, branded card layout shared by Login, Signup, ForgotPassword and
 * ResetPassword. Kept intentionally dumb — anything specific (form fields,
 * social buttons, alerts) is composed in by the caller so each page can vary
 * freely while the chrome stays identical.
 */
export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <Box
      sx={{
        minHeight: { xs: "calc(100vh - 120px)", md: "calc(100vh - 140px)" },
        display: "flex",
        alignItems: "center",
        py: { xs: 4, md: 6 },
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            maxWidth: 440,
            mx: "auto",
          }}
        >
          <Stack spacing={3} sx={{ alignItems: "center" }}>
            <YCompanyLogo variant="full" color="dark" height={40} />
            <Box sx={{ textAlign: "center", width: "100%" }}>
              <Typography variant="h1" sx={{ fontSize: "1.75rem", mb: 0.75 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            {children}
            {footer}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

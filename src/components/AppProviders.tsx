"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { I18nProvider } from "@/i18n/client";
import { QueryProvider } from "@/providers/QueryProvider";
import { theme } from "@/theme/theme";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionProvider>
          <QueryProvider>
            <I18nProvider>
              <CartProvider>{children}</CartProvider>
            </I18nProvider>
          </QueryProvider>
        </SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

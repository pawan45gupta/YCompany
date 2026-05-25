import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { I18nProvider } from "@/i18n/client";
import { theme } from "@/theme/theme";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createHookWrapper(queryClient = createTestQueryClient()) {
  return function HookWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };
}

type Options = Omit<RenderOptions, "wrapper"> & {
  queryClient?: QueryClient;
  withCart?: boolean;
};

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { queryClient = createTestQueryClient(), withCart = true, ...renderOptions } =
    options;

  function Wrapper({ children }: { children: ReactNode }) {
    const inner = withCart ? <CartProvider>{children}</CartProvider> : children;
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <I18nProvider>{inner}</I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

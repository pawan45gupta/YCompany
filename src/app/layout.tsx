import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { GoogleAnalyticsProvider } from "@/components/observability/GoogleAnalytics";
import { NewRelicBrowser } from "@/components/observability/NewRelicBrowser";
import { getTranslations } from "@/i18n/server";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

const { dict } = getTranslations();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: dict.meta.defaultTitle,
    template: dict.meta.titleTemplate,
  },
  description: dict.meta.defaultDescription,
  openGraph: {
    type: "website",
    locale: dict.meta.locale,
    siteName: dict.meta.siteName,
    title: dict.meta.defaultTitle,
    description: dict.meta.ogDescription,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/logo-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo-mark.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* NR Browser agent — must boot before any other JS so it can
            attach AJAX/error/timing handlers. Server-rendered each request
            to bind to the active APM transaction. No-ops when NR is off. */}
        <NewRelicBrowser />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppProviders>
          <Header />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </AppProviders>
        <GoogleAnalyticsProvider />
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";
import { getTranslations } from "@/i18n/server";

export default function manifest(): MetadataRoute.Manifest {
  const { dict } = getTranslations();
  return {
    name: dict.meta.siteName,
    short_name: dict.meta.siteName,
    description: dict.meta.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a1a1a",
    icons: [
      {
        src: "/logo-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

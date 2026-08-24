import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

const base = resolveSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}

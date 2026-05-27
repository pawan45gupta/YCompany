import { NextResponse } from "next/server";
import { products } from "@/data/products";
import {
  buildSearchQueryString,
  getCatalogPriceBounds,
  parseFiltersFromSearchParams,
} from "@/lib/product-filters";
import { nrRecordEvent } from "@/lib/observability/newrelic-server";
import { searchCatalog } from "@/lib/search-index";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local";
  const limited = rateLimit(`search:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limited.retryAfter },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const bounds = getCatalogPriceBounds();
  const filters = parseFiltersFromSearchParams(
    {
      q: url.searchParams.get("q"),
      brands: url.searchParams.get("brands"),
      min: url.searchParams.get("min"),
      max: url.searchParams.get("max"),
      sort: url.searchParams.get("sort"),
    },
    bounds,
  );

  const started = performance.now();
  const results = searchCatalog(products, filters);
  const tookMs = Math.round(performance.now() - started);

  // Only emit a NR event when there's an actual search term. Cold loads
  // of /search (no `q`) would otherwise flood the events feed.
  if (filters.query) {
    void nrRecordEvent("Search", {
      query: filters.query,
      result_count: results.length,
      took_ms: tookMs,
      brand_count: filters.brands?.length ?? 0,
      has_price_filter:
        filters.minPriceCents !== bounds.min ||
        filters.maxPriceCents !== bounds.max,
    });
  }

  return NextResponse.json(
    {
      products: results,
      total: results.length,
      tookMs,
      queryString: buildSearchQueryString(filters, bounds),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}

"use client";

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useProductSearch } from "@/hooks/api/use-product-search";
import { useTranslation } from "@/i18n/client";
import {
  buildSearchQueryString,
  countActiveFilters,
  formatPrice,
  getBrandProductCounts,
  getCatalogBrands,
  getCatalogPriceBounds,
  parseFiltersFromSearchParams,
} from "@/lib/product-filters";
import { useDebounce } from "@/lib/use-debounce";
import { trackSearch } from "@/lib/observability/analytics";
import type { ProductFilters, ProductSort, Product } from "@/types/product";

const SORT_VALUES: ProductSort[] = ["relevance", "price-asc", "price-desc", "name"];

const SORT_KEYS: Record<ProductSort, string> = {
  relevance: "search.sort.relevance",
  "price-asc": "search.sort.priceAsc",
  "price-desc": "search.sort.priceDesc",
  name: "search.sort.name",
};

const brands = getCatalogBrands();
const priceBounds = getCatalogPriceBounds();
const brandCounts = getBrandProductCounts();

function SearchResultsBody({
  isPending,
  results,
  isSearchStale,
  onClearAll,
}: {
  isPending: boolean;
  results: Product[];
  isSearchStale: boolean;
  onClearAll: () => void;
}) {
  const { t } = useTranslation();

  if (isPending && results.length === 0) {
    return <Typography color="text.secondary">{t("common.loading")}</Typography>;
  }

  if (results.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("search.noMatches")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("search.noMatchesBody")}
        </Typography>
        <Button variant="contained" onClick={onClearAll}>
          {t("search.resetSearch")}
        </Button>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        opacity: isSearchStale ? 0.72 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      {results.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </Box>
  );
}

function FiltersPanel({
  filters,
  priceRange,
  onBrandToggle,
  onPriceDraft,
  onPriceCommit,
  onClear,
}: {
  filters: ProductFilters;
  priceRange: [number, number];
  onBrandToggle: (brand: string) => void;
  onPriceDraft: (range: [number, number]) => void;
  onPriceCommit: (range: [number, number]) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const activeCount = countActiveFilters(filters);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack
        sx={{
          mb: 2,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          <TuneIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t("search.filters")}
          </Typography>
          {activeCount > 0 && (
            <Chip label={activeCount} size="small" color="secondary" sx={{ height: 22 }} />
          )}
        </Stack>
        {activeCount > 0 && (
          <Button size="small" onClick={onClear}>
            {t("common.clear")}
          </Button>
        )}
      </Stack>

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {t("search.price")}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
        {formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}
      </Typography>
      <Slider
        value={priceRange}
        min={priceBounds.min}
        max={priceBounds.max}
        step={500}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => formatPrice(v)}
        onChange={(_, value) => onPriceDraft(value as [number, number])}
        onChangeCommitted={(_, value) => onPriceCommit(value as [number, number])}
        sx={{ mb: 3, mt: 0.5 }}
      />

      <Divider sx={{ mb: 2 }} />

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {t("search.brand")}
      </Typography>
      <FormGroup>
        {brands.map((brand) => (
          <FormControlLabel
            key={brand}
            control={
              <Checkbox
                size="small"
                checked={filters.brands?.includes(brand) ?? false}
                onChange={() => onBrandToggle(brand)}
              />
            }
            label={
              <Typography variant="body2">
                {brand}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                  ({brandCounts[brand] ?? 0})
                </Typography>
              </Typography>
            }
          />
        ))}
      </FormGroup>
    </Paper>
  );
}

export function SearchClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortOptions = useMemo(
    () =>
      SORT_VALUES.map((value) => ({
        value,
        label: t(SORT_KEYS[value]),
      })),
    [t],
  );

  const filters = useMemo(
    () =>
      parseFiltersFromSearchParams({
        q: searchParams.get("q"),
        brands: searchParams.get("brands"),
        min: searchParams.get("min"),
        max: searchParams.get("max"),
        sort: searchParams.get("sort"),
      }),
    [searchParams],
  );

  const [queryInput, setQueryInput] = useState(filters.query ?? "");
  const [lastUrlQuery, setLastUrlQuery] = useState(filters.query ?? "");
  const debouncedQuery = useDebounce(queryInput, 300);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState<[number, number] | null>(null);

  const urlQuery = filters.query ?? "";
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setQueryInput(urlQuery);
  }

  const pushFilters = useCallback(
    (next: ProductFilters) => {
      router.replace(`/search${buildSearchQueryString(next)}`);
    },
    [router],
  );

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    const urlQuery = searchParams.get("q")?.trim() ?? "";
    if (trimmed === urlQuery) return;
    if (trimmed) trackSearch(trimmed);
    pushFilters({
      ...filters,
      query: trimmed || undefined,
    });
  }, [debouncedQuery, filters, pushFilters, searchParams]);

  const priceRange: [number, number] = useMemo(
    () => [
      filters.minPriceCents ?? priceBounds.min,
      filters.maxPriceCents ?? priceBounds.max,
    ],
    [filters.minPriceCents, filters.maxPriceCents],
  );

  const displayPriceRange = priceDraft ?? priceRange;

  const searchFilters = useMemo(
    () => ({
      ...filters,
      query: debouncedQuery.trim() || undefined,
    }),
    [filters, debouncedQuery],
  );

  const {
    products: results,
    isFetching,
    isPending,
    isPlaceholderData,
  } = useProductSearch(searchFilters);
  const isSearchStale = isFetching || isPlaceholderData;

  const updateQuery = (value: string) => {
    setQueryInput(value);
  };

  const toggleBrand = (brand: string) => {
    const current = filters.brands ?? [];
    const next = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    pushFilters({
      ...filters,
      brands: next.length ? next : undefined,
    });
  };

  const setPriceRange = (range: [number, number]) => {
    pushFilters({
      ...filters,
      minPriceCents: range[0] > priceBounds.min ? range[0] : undefined,
      maxPriceCents: range[1] < priceBounds.max ? range[1] : undefined,
    });
  };

  const clearFilters = () => {
    pushFilters({ query: filters.query });
  };

  const clearAll = () => {
    setQueryInput("");
    router.replace("/search");
  };

  const activeFilterCount = countActiveFilters(filters);
  const sortValue = filters.sort ?? "relevance";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h1" sx={{ fontSize: "2rem", mb: 1 }}>
        {t("search.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 560 }}>
        {t("search.intro")}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          size="medium"
          placeholder={t("search.placeholder")}
          value={queryInput}
          onChange={(e) => updateQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: queryInput ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={t("search.clearSearchAria")}
                    onClick={() => updateQuery("")}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              bgcolor: "background.paper",
              minHeight: 56,
              alignItems: "center",
            },
            "& .MuiOutlinedInput-input": {
              py: 1.75,
              fontSize: "1.0625rem",
            },
          }}
        />

        {(filters.brands?.length || activeFilterCount > 0) && (
          <Stack sx={{ mt: 2, flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
            {filters.brands?.map((brand) => (
              <Chip
                key={brand}
                label={brand}
                size="small"
                onDelete={() => toggleBrand(brand)}
              />
            ))}
            {(filters.minPriceCents != null || filters.maxPriceCents != null) && (
              <Chip
                label={`${formatPrice(priceRange[0])} – ${formatPrice(priceRange[1])}`}
                size="small"
                onDelete={() =>
                  pushFilters({
                    ...filters,
                    minPriceCents: undefined,
                    maxPriceCents: undefined,
                  })
                }
              />
            )}
            <Chip
              label={t("search.clearFilters")}
              size="small"
              variant="outlined"
              onClick={clearFilters}
            />
          </Stack>
        )}
      </Paper>

      <Box sx={{ display: { xs: "flex", md: "none" }, mb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<TuneIcon />}
          onClick={() => setMobileFiltersOpen((o) => !o)}
        >
          {mobileFiltersOpen ? t("search.hideFilters") : t("search.showFilters")}
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
          alignItems: "start",
        }}
      >
        <Box sx={{ display: { xs: mobileFiltersOpen ? "block" : "none", md: "block" } }}>
          <FiltersPanel
            filters={filters}
            priceRange={displayPriceRange}
            onBrandToggle={toggleBrand}
            onPriceDraft={setPriceDraft}
            onPriceCommit={(range) => {
              setPriceDraft(null);
              setPriceRange(range);
            }}
            onClear={clearFilters}
          />
        </Box>

        <Box>
          <Stack
            spacing={2}
            sx={{
              mb: 3,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {results.length === 1
                ? t("search.results", { count: results.length })
                : t("search.resultsPlural", { count: results.length })}
              {queryInput.trim() ? (
                <> {t("search.resultsFor", { query: queryInput.trim() })}</>
              ) : null}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="search-sort-label">{t("search.sortBy")}</InputLabel>
              <Select
                labelId="search-sort-label"
                label={t("search.sortBy")}
                value={sortValue}
                onChange={(e) =>
                  pushFilters({
                    ...filters,
                    sort: e.target.value === "relevance" ? undefined : (e.target.value as ProductSort),
                  })
                }
              >
                {sortOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <SearchResultsBody
            isPending={isPending}
            results={results}
            isSearchStale={isSearchStale}
            onClearAll={clearAll}
          />
        </Box>
      </Box>
    </Container>
  );
}

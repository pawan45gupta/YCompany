import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { YCompanyLogo } from "@/components/YCompanyLogo";

/** Shared shimmer for skeleton placeholders. */
export const shimmerPlaceholderSx = {
  position: "relative",
  overflow: "hidden",
  bgcolor: "grey.100",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    transform: "translateX(-100%)",
    background:
      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent)",
    animation: "appLoaderShimmer 1.6s ease-in-out infinite",
  },
  "@keyframes appLoaderShimmer": {
    "100%": { transform: "translateX(100%)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "&::after": { animation: "none" },
  },
} as const;

const loaderKeyframes = {
  "@keyframes appLoaderPulse": {
    "0%, 100%": { transform: "scale(1)", opacity: 1 },
    "50%": { transform: "scale(1.04)", opacity: 0.92 },
  },
  "@keyframes appLoaderOrbit": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
  "@keyframes appLoaderBar": {
    "0%": { transform: "translateX(-100%)" },
    "100%": { transform: "translateX(200%)" },
  },
  "@keyframes appLoaderFade": {
    "0%, 100%": { opacity: 0.55 },
    "50%": { opacity: 1 },
  },
} as const;

type AppLoaderProps = Readonly<{
  label?: string;
  minHeight?: string | number;
}>;

/** Branded full-page loader with subtle motion. */
export function AppLoader({ label, minHeight = "42vh" }: AppLoaderProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      sx={{
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 6, md: 8 },
        ...loaderKeyframes,
        "@media (prefers-reduced-motion: reduce)": {
          "& .app-loader-motion": { animation: "none !important" },
        },
      }}
    >
      <Stack spacing={3} sx={{ alignItems: "center", width: "100%", maxWidth: 280 }}>
        <Box
          sx={{
            position: "relative",
            width: 88,
            height: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            className="app-loader-motion"
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(from 0deg, rgba(139,41,66,0.08), rgba(196,92,122,0.35), rgba(26,26,26,0.12), rgba(139,41,66,0.08))",
              animation: "appLoaderOrbit 2.8s linear infinite",
            }}
          />
          <Box
            className="app-loader-motion"
            sx={{
              position: "relative",
              zIndex: 1,
              animation: "appLoaderPulse 2s ease-in-out infinite",
            }}
          >
            <YCompanyLogo variant="mark" color="dark" height={52} />
          </Box>
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: 200,
            height: 4,
            borderRadius: 999,
            bgcolor: "grey.200",
            overflow: "hidden",
          }}
        >
          <Box
            className="app-loader-motion"
            sx={{
              width: "45%",
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #8b2942, #c45c7a, #1a1a1a)",
              animation: "appLoaderBar 1.4s ease-in-out infinite",
            }}
          />
        </Box>

        {label ? (
          <Typography
            className="app-loader-motion"
            variant="body2"
            color="text.secondary"
            sx={{ animation: "appLoaderFade 2s ease-in-out infinite" }}
          >
            {label}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

type ProductGridSkeletonProps = Readonly<{ count?: number }>;

/** Animated product grid placeholder for catalog routes. */
export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        },
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={`product-skeleton-${i}`}
          variant="rounded"
          height={360}
          sx={{
            borderRadius: 2,
            ...shimmerPlaceholderSx,
          }}
        />
      ))}
    </Box>
  );
}

type SearchPageSkeletonProps = Readonly<{ label?: string }>;

/** Search route fallback with filter + results placeholders. */
export function SearchPageSkeleton({ label }: SearchPageSkeletonProps) {
  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Skeleton variant="text" width={200} height={40} sx={shimmerPlaceholderSx} />
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 999, ...shimmerPlaceholderSx }} />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
        }}
      >
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2, ...shimmerPlaceholderSx }} />
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={`search-skeleton-${i}`}
              variant="rounded"
              height={320}
              sx={{ borderRadius: 2, ...shimmerPlaceholderSx }}
            />
          ))}
        </Box>
      </Box>
      {label ? (
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
          {label}
        </Typography>
      ) : null}
    </Stack>
  );
}

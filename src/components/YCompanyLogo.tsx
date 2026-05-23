import { Box, type SxProps, type Theme } from "@mui/material";

type Variant = "full" | "mark";
type ColorMode = "light" | "dark";

type Props = {
  variant?: Variant;
  color?: ColorMode;
  height?: number;
  sx?: SxProps<Theme>;
};

const colors = {
  light: {
    markBg: "#1a1a1a",
    markStroke: "#fafafa",
    accent: "#c45c7a",
    word: "#fafafa",
    wordMuted: "rgba(250,250,250,0.92)",
  },
  dark: {
    markBg: "#1a1a1a",
    markStroke: "#fafafa",
    accent: "#8b2942",
    word: "#1a1a1a",
    wordMuted: "#3d3d3d",
  },
} as const;

function LogoMark({ palette, size }: { palette: (typeof colors)[ColorMode]; size: number }) {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden
      sx={{ display: "block", flexShrink: 0 }}
    >
      <rect width="40" height="40" rx="10" fill={palette.markBg} />
      <path
        d="M11 12 L19 26 V32 M29 12 L21 26 V32"
        stroke={palette.markStroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 12 H26"
        stroke={palette.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Box>
  );
}

/** YCompany brand logo — monogram mark + wordmark. */
export function YCompanyLogo({
  variant = "full",
  color = "dark",
  height = 36,
  sx,
}: Props) {
  const palette = colors[color];
  const markSize = height;

  if (variant === "mark") {
    return (
      <Box sx={{ display: "inline-flex", lineHeight: 0, ...sx }}>
        <LogoMark palette={palette} size={markSize} />
      </Box>
    );
  }

  const wordHeight = height;
  const width = height * 4.9;

  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 196 40"
      width={width}
      height={wordHeight}
      role="img"
      aria-label="YCompany"
      sx={{ display: "block", flexShrink: 0, ...sx }}
    >
      <rect width="40" height="40" rx="10" fill={palette.markBg} />
      <path
        d="M11 12 L19 26 V32 M29 12 L21 26 V32"
        stroke={palette.markStroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 12 H26"
        stroke={palette.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text
        x="48"
        y="27"
        fill={palette.word}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="22"
        fontWeight="600"
        letterSpacing="-0.5"
      >
        Y
      </text>
      <text
        x="66"
        y="27"
        fill={palette.wordMuted}
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fontSize="17"
        fontWeight="600"
        letterSpacing="-0.3"
      >
        Company
      </text>
    </Box>
  );
}

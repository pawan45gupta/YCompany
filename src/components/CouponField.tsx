"use client";

import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { applyCoupon } from "@/lib/coupons";
import { useTranslation } from "@/i18n/client";
import { comfortableTextFieldSx } from "@/theme/form-fields";

const SUGGESTED_CODES = ["WELCOME10", "SAVE20", "FREESHIP"] as const;

type Props = {
  value: string;
  onChange: (code: string) => void;
  subtotalCents: number;
  /** Show inline Apply button and validate on click (default: true). */
  showApplyButton?: boolean;
  /** Validate as user types (default: false when showApplyButton). */
  validateLive?: boolean;
};

export function CouponField({
  value,
  onChange,
  subtotalCents,
  showApplyButton = true,
  validateLive,
}: Props) {
  const { t } = useTranslation();
  const [touched, setTouched] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const live = validateLive ?? !showApplyButton;

  const result = useMemo(() => {
    const code = live || touched || appliedCode ? (appliedCode ?? value) : "";
    if (!code.trim()) return null;
    return applyCoupon(code, subtotalCents);
  }, [live, touched, appliedCode, value, subtotalCents]);

  const apply = () => {
    setTouched(true);
    setAppliedCode(value.trim().toUpperCase());
  };

  const applySuggested = (code: string) => {
    onChange(code);
    setTouched(true);
    setAppliedCode(code);
  };

  const displayResult = appliedCode || (live && value.trim()) ? result : null;

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t("coupon.promoCode")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          alignItems: { xs: "stretch", sm: "flex-start" },
        }}
      >
        <TextField
          fullWidth
          size="medium"
          placeholder={t("coupon.placeholder")}
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            if (appliedCode && e.target.value.toUpperCase() !== appliedCode) {
              setAppliedCode(null);
              setTouched(false);
            }
          }}
          onBlur={() => {
            if (live && value.trim()) setTouched(true);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LocalOfferOutlinedIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={comfortableTextFieldSx}
        />
        {showApplyButton && (
          <Button
            variant="outlined"
            onClick={apply}
            disabled={!value.trim() || subtotalCents === 0}
            sx={{ minHeight: 52, px: 3, flexShrink: 0 }}
          >
            {t("common.apply")}
          </Button>
        )}
      </Box>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        {SUGGESTED_CODES.map((code) => (
          <Chip
            key={code}
            label={code}
            size="small"
            variant="outlined"
            onClick={() => applySuggested(code)}
            sx={{ cursor: "pointer" }}
          />
        ))}
      </Stack>
      {displayResult && (
        <Alert severity={displayResult.valid ? "success" : "warning"} variant="outlined">
          {displayResult.message}
        </Alert>
      )}
    </Stack>
  );
}

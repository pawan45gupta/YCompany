"use client";

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/client";
import { formatPrice } from "@/lib/product-filters";
import { getProductSuggestions } from "@/lib/product-suggestions";
import type { Product } from "@/types/product";

type Props = Readonly<{
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (product: Product) => void;
  onClear?: () => void;
  placeholder: string;
  sx?: SxProps<Theme>;
  inputSx?: SxProps<Theme>;
  minChars?: number;
  maxSuggestions?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}>;

export function ProductSearchAutocomplete({
  value,
  onChange,
  onProductSelect,
  onClear,
  placeholder,
  sx,
  inputSx,
  minChars = 2,
  maxSuggestions = 8,
  onFocus,
  onBlur,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(
    () => getProductSuggestions(value, maxSuggestions, minChars),
    [value, maxSuggestions, minChars],
  );

  const canSuggest = value.trim().length >= minChars;
  const showClear = value.length > 0;

  const handleClear = () => {
    onChange("");
    setOpen(false);
    onClear?.();
  };

  return (
    <Autocomplete
      freeSolo
      open={open && canSuggest}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={suggestions}
      inputValue={value}
      onInputChange={(_, newValue, reason) => {
        if (reason === "input" || reason === "clear") {
          onChange(newValue);
          setOpen(newValue.trim().length >= minChars);
        }
        if (reason === "reset") {
          onChange(newValue);
          setOpen(false);
        }
      }}
      onChange={(_, newValue) => {
        if (newValue && typeof newValue !== "string") {
          onChange(newValue.name);
          onProductSelect(newValue);
          setOpen(false);
        }
      }}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.name
      }
      isOptionEqualToValue={(option, selected) =>
        typeof option !== "string" &&
        typeof selected !== "string" &&
        option.id === selected.id
      }
      filterOptions={(options) => options}
      openOnFocus={false}
      clearOnBlur={false}
      disableClearable
      forcePopupIcon={false}
      noOptionsText={t("header.searchNoMatches")}
      slotProps={{
        popper: {
          sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
        },
        paper: {
          sx: { mt: 0.5, borderRadius: 2, overflow: "hidden" },
        },
        listbox: {
          sx: { py: 0.5 },
        },
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        return (
          <Box
            component="li"
            key={key}
            {...rest}
            sx={{
              display: "flex !important",
              alignItems: "center",
              gap: 1.5,
              py: 1,
              px: 1.5,
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "grey.100",
              }}
            >
              <Image
                src={option.image}
                alt=""
                fill
                sizes="44px"
                style={{ objectFit: "cover" }}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {option.brand} ·{" "}
                {formatPrice(option.priceCents, option.currency.toUpperCase())}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          id={params.id}
          disabled={params.disabled}
          fullWidth={params.fullWidth}
          size={params.size}
          placeholder={placeholder}
          onFocus={() => {
            onFocus?.();
            if (canSuggest) setOpen(true);
          }}
          onBlur={() => {
            onBlur?.();
          }}
          slotProps={{
            inputLabel: params.slotProps.inputLabel,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": t("header.searchAria"),
            },
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {params.slotProps.input.endAdornment}
                  {showClear ? (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        edge="end"
                        size="small"
                        aria-label={t("search.clearSearchAria")}
                        onClick={handleClear}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null}
                  <InputAdornment position="end">
                    <IconButton type="submit" edge="end" aria-label={t("header.searchAria")}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                </>
              ),
            },
          }}
          sx={inputSx}
        />
      )}
      sx={{ width: "100%", ...sx }}
    />
  );
}

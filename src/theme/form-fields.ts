/** Comfortable input height and placeholder alignment (checkout, cart, forms). */
export const comfortableTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 52,
    alignItems: "center",
    borderRadius: 2,
  },
  "& .MuiOutlinedInput-input": {
    py: 1.5,
    fontSize: "1rem",
    lineHeight: 1.5,
  },
} as const;

export const comfortableTextFieldRoundedSx = {
  ...comfortableTextFieldSx,
  "& .MuiOutlinedInput-root": {
    ...comfortableTextFieldSx["& .MuiOutlinedInput-root"],
    borderRadius: 999,
  },
} as const;

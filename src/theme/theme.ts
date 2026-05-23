import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#1a1a1a",
      contrastText: "#fafafa",
    },
    secondary: {
      main: "#8b2942",
      contrastText: "#fff",
    },
    background: {
      default: "#f6f4f1",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    h1: { fontWeight: 600, letterSpacing: "-0.02em" },
    h2: { fontWeight: 600, letterSpacing: "-0.02em" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1.5,
          boxSizing: "border-box",
        },
        endIcon: {
          display: "inline-flex",
          alignItems: "center",
          marginLeft: 4,
        },
        startIcon: {
          display: "inline-flex",
          alignItems: "center",
          marginRight: 4,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          alignItems: "center",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          lineHeight: 1.5,
        },
        input: {
          font: "inherit",
        },
        textarea: {
          font: "inherit",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          lineHeight: 1.5,
        },
        input: {
          lineHeight: 1.5,
          "&::placeholder": {
            lineHeight: 1.5,
            opacity: 0.6,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          alignItems: "center",
          "&.MuiInputBase-sizeSmall .MuiOutlinedInput-input": {
            paddingTop: 8,
            paddingBottom: 8,
          },
        },
        input: {
          paddingTop: 14,
          paddingBottom: 14,
          lineHeight: 1.5,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          lineHeight: 1.5,
        },
        outlined: {
          top: "50%",
          transform: "translate(14px, -50%) scale(1)",
          "&.MuiInputLabel-sizeSmall": {
            transform: "translate(14px, -50%) scale(1)",
          },
          "&.Mui-focused": {
            top: 0,
            transform: "translate(14px, -9px) scale(0.75)",
          },
          "&.MuiInputLabel-shrink": {
            top: 0,
            transform: "translate(14px, -9px) scale(0.75)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

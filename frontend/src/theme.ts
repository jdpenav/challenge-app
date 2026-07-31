import { createTheme } from "@mui/material/styles";

export const TABLET_MIN_WIDTH = 641;
export const DESKTOP_MIN_WIDTH = 1024;

const colors = {
  background: "#F7F8F9",
  surface: "#FFFFFF",
  border: "#E4E7EB",
  textPrimary: "#1A1D21",
  textSecondary: "#6B7280",
  accent: "#1F5FA9",
  accentDark: "#17497F",
  accentSoft: "#EDF3FA",
};

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: TABLET_MIN_WIDTH,
      md: DESKTOP_MIN_WIDTH,
      lg: 1280,
      xl: 1600,
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: colors.accent,
      dark: colors.accentDark,
      light: colors.accentSoft,
      contrastText: colors.surface,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.border,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: { fontSize: "1.5rem", fontWeight: 650, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontSize: "0.9375rem", fontWeight: 600 },
    body2: { fontSize: "0.875rem" },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.02em",
      color: colors.textSecondary,
    },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
          WebkitFontSmoothing: "antialiased",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 16 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: colors.surface,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
        outlined: { borderColor: colors.border },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        },
      },
    },
  },
});

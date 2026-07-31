import { useMediaQuery, useTheme } from "@mui/material";
import type { CarImageSize } from "../types/car";

export function useCarImageSize(): CarImageSize {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  if (isDesktop) {
    return "desktop";
  }
  return isTablet ? "tablet" : "mobile";
}

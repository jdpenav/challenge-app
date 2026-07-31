import type { ReactElement, ReactNode } from "react";
import { ThemeProvider } from "@mui/material";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { theme } from "../theme";

function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export function renderWithTheme(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, { wrapper: Providers, ...options });
}

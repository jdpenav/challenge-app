import { ThemeProvider } from "@mui/material";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCarImageSize } from "../hooks/useCarImageSize";
import { DESKTOP_WIDTH, MOBILE_WIDTH, TABLET_WIDTH, setViewportWidth } from "../test/viewport";
import { theme } from "../theme";

function sizeAt(width: number): string {
  setViewportWidth(width);

  const { result } = renderHook(() => useCarImageSize(), {
    wrapper: ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>,
  });

  return result.current;
}

describe("useCarImageSize", () => {
  it("returns mobile below the tablet breakpoint", () => {
    expect(sizeAt(MOBILE_WIDTH)).toBe("mobile");
  });

  it("returns mobile at exactly 640px", () => {
    expect(sizeAt(640)).toBe("mobile");
  });

  it("returns tablet from 641px", () => {
    expect(sizeAt(641)).toBe("tablet");
  });

  it("returns tablet inside the tablet range", () => {
    expect(sizeAt(TABLET_WIDTH)).toBe("tablet");
  });

  it("returns tablet at 1023px", () => {
    expect(sizeAt(1023)).toBe("tablet");
  });

  it("returns desktop from 1024px", () => {
    expect(sizeAt(1024)).toBe("desktop");
  });

  it("returns desktop on wide screens", () => {
    expect(sizeAt(DESKTOP_WIDTH)).toBe("desktop");
  });
});

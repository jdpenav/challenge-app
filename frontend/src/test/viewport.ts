export const MOBILE_WIDTH = 480;
export const TABLET_WIDTH = 800;
export const DESKTOP_WIDTH = 1440;

let currentWidth = DESKTOP_WIDTH;

function readBound(query: string, bound: "min" | "max"): number | undefined {
  const match = query.match(new RegExp(`${bound}-width:\\s*(\\d+(?:\\.\\d+)?)px`));
  return match ? Number(match[1]) : undefined;
}

function evaluate(query: string): boolean {
  const min = readBound(query, "min");
  const max = readBound(query, "max");

  if (min !== undefined && currentWidth < min) {
    return false;
  }
  if (max !== undefined && currentWidth > max) {
    return false;
  }
  return min !== undefined || max !== undefined;
}

export function setViewportWidth(width: number): void {
  currentWidth = width;
}

export function installMatchMedia(): void {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: evaluate(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

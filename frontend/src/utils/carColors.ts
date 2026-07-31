const SWATCHES: Record<string, string> = {
  black: "#111827",
  blue: "#2563EB",
  brown: "#78350F",
  gold: "#CA8A04",
  green: "#16A34A",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  orange: "#EA580C",
  red: "#DC2626",
  silver: "#C7CBD1",
  white: "#FFFFFF",
  yellow: "#EAB308",
};

export function swatchFor(color: string): string {
  return SWATCHES[color.trim().toLowerCase()] ?? "#D1D5DB";
}

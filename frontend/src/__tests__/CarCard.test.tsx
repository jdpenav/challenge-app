import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CarCard } from "../components/CarCard";
import { renderWithTheme } from "../test/render";
import type { Car } from "../types/car";

const car: Car = {
  id: "1",
  make: "Audi",
  model: "Q5",
  year: 2023,
  color: "Blue",
  mobile: "https://images.test/q5-mobile.png",
  tablet: "https://images.test/q5-tablet.png",
  desktop: "https://images.test/q5-desktop.png",
};

describe("CarCard", () => {
  it("shows the make, model, year and color", () => {
    renderWithTheme(<CarCard car={car} imageSize="desktop" />);

    expect(screen.getByText("Audi")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Q5" })).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it.each([
    ["mobile", "https://images.test/q5-mobile.png"],
    ["tablet", "https://images.test/q5-tablet.png"],
    ["desktop", "https://images.test/q5-desktop.png"],
  ] as const)("renders the %s image", (size, expected) => {
    renderWithTheme(<CarCard car={car} imageSize={size} />);

    expect(screen.getByRole("img", { name: "Audi Q5" })).toHaveAttribute("src", expected);
  });

  it("describes the image for assistive technology", () => {
    renderWithTheme(<CarCard car={car} imageSize="desktop" />);

    expect(screen.getByRole("img", { name: "Audi Q5" })).toBeInTheDocument();
  });

  it("loads the image lazily", () => {
    renderWithTheme(<CarCard car={car} imageSize="desktop" />);

    expect(screen.getByRole("img", { name: "Audi Q5" })).toHaveAttribute("loading", "lazy");
  });

  it("falls back to a placeholder when the car has no image", () => {
    const withoutImage = { ...car, mobile: "", tablet: "", desktop: "" };

    renderWithTheme(<CarCard car={withoutImage} imageSize="desktop" />);

    expect(
      screen.getByRole("img", { name: "Audi Q5, no image available" }),
    ).toBeInTheDocument();
  });
});

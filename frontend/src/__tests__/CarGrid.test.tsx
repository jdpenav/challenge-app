import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CarGrid } from "../components/CarGrid";
import { renderWithTheme } from "../test/render";
import type { Car } from "../types/car";

const cars: Car[] = [
  {
    id: "1",
    make: "Audi",
    model: "Q5",
    year: 2023,
    color: "Blue",
    mobile: "m.png",
    tablet: "t.png",
    desktop: "d.png",
  },
  {
    id: "2",
    make: "Audi",
    model: "A3",
    year: 2022,
    color: "Red",
    mobile: "m.png",
    tablet: "t.png",
    desktop: "d.png",
  },
];

describe("CarGrid", () => {
  it("renders one card per car", () => {
    renderWithTheme(<CarGrid cars={cars} loading={false} />);

    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("announces the loading state instead of the cards", () => {
    renderWithTheme(<CarGrid cars={[]} loading />);

    expect(screen.getByLabelText("Loading cars")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("shows the error and offers a retry", async () => {
    const onRetry = vi.fn();
    renderWithTheme(
      <CarGrid cars={[]} loading={false} error={new Error("network down")} onRetry={onRetry} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("network down");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the empty message when there is nothing to list", () => {
    renderWithTheme(<CarGrid cars={[]} loading={false} emptyMessage="No cars match" />);

    expect(screen.getByText("No cars match")).toBeInTheDocument();
  });

  it("renders the empty action", () => {
    renderWithTheme(
      <CarGrid cars={[]} loading={false} emptyAction={<button>Clear filters</button>} />,
    );

    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});

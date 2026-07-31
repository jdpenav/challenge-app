import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { normalize, useCarFilters } from "../hooks/useCarFilters";
import type { Car } from "../types/car";

function car(id: string, make: string, model: string, year: number): Car {
  return {
    id,
    make,
    model,
    year,
    color: "Blue",
    mobile: "m.png",
    tablet: "t.png",
    desktop: "d.png",
  };
}

const cars = [
  car("1", "Audi", "Q5", 2023),
  car("2", "Audi", "A3", 2022),
  car("3", "Audi", "R8", 2024),
];

function models(list: Car[]): string {
  return list.map((item) => item.model).join(",");
}

describe("normalize", () => {
  it("lowercases and trims", () => {
    expect(normalize("  Q5  ")).toBe("q5");
  });

  it("removes diacritics", () => {
    expect(normalize("Citroën")).toBe("citroen");
  });
});

describe("useCarFilters", () => {
  it("returns every car sorted by model by default", () => {
    const { result } = renderHook(() => useCarFilters(cars));

    expect(models(result.current.cars)).toBe("A3,Q5,R8");
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("exposes the available years newest first", () => {
    const { result } = renderHook(() => useCarFilters(cars));

    expect(result.current.availableYears).toEqual([2024, 2023, 2022]);
  });

  it("does not mutate the source array", () => {
    renderHook(() => useCarFilters(cars));

    expect(models(cars)).toBe("Q5,A3,R8");
  });

  describe("search", () => {
    it("filters by model", () => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.setSearch("r8"));

      expect(models(result.current.cars)).toBe("R8");
    });

    it("ignores case and surrounding spaces", () => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.setSearch("  Q5 "));

      expect(models(result.current.cars)).toBe("Q5");
    });

    it("matches partial terms", () => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.setSearch("3"));

      expect(models(result.current.cars)).toBe("A3");
    });

    it("returns nothing when there is no match", () => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.setSearch("corolla"));

      expect(result.current.cars).toHaveLength(0);
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe("sorting", () => {
    it.each([
      ["model-asc", "A3,Q5,R8"],
      ["model-desc", "R8,Q5,A3"],
      ["year-desc", "R8,Q5,A3"],
      ["year-asc", "A3,Q5,R8"],
    ] as const)("orders by %s", (key, expected) => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.setSort(key));

      expect(models(result.current.cars)).toBe(expected);
    });
  });

  describe("year filter", () => {
    it("keeps only the selected year", () => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.toggleYear(2024));

      expect(models(result.current.cars)).toBe("R8");
    });

    it("supports selecting several years", () => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.toggleYear(2024));
      act(() => result.current.toggleYear(2022));

      expect(models(result.current.cars)).toBe("A3,R8");
    });

    it("deselects a year when toggled twice", () => {
      const { result } = renderHook(() => useCarFilters(cars));

      act(() => result.current.toggleYear(2024));
      act(() => result.current.toggleYear(2024));

      expect(result.current.cars).toHaveLength(3);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  it("combines search and year", () => {
    const { result } = renderHook(() => useCarFilters(cars));

    act(() => result.current.setSearch("a"));
    act(() => result.current.toggleYear(2022));

    expect(models(result.current.cars)).toBe("A3");
  });

  it("clears search and years but keeps the sort", () => {
    const { result } = renderHook(() => useCarFilters(cars));

    act(() => result.current.setSearch("r8"));
    act(() => result.current.toggleYear(2024));
    act(() => result.current.setSort("year-asc"));
    act(() => result.current.clearFilters());

    expect(result.current.cars).toHaveLength(3);
    expect(result.current.search).toBe("");
    expect(result.current.selectedYears).toEqual([]);
    expect(result.current.sort).toBe("year-asc");
  });
});

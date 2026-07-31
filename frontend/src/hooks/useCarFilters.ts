import { useCallback, useMemo, useState } from "react";
import type { Car } from "../types/car";

export type SortKey = "model-asc" | "model-desc" | "year-desc" | "year-asc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "model-asc", label: "Model A to Z" },
  { value: "model-desc", label: "Model Z to A" },
  { value: "year-desc", label: "Newest first" },
  { value: "year-asc", label: "Oldest first" },
];

const SORTERS: Record<SortKey, (a: Car, b: Car) => number> = {
  "model-asc": (a, b) => a.model.localeCompare(b.model),
  "model-desc": (a, b) => b.model.localeCompare(a.model),
  "year-desc": (a, b) => b.year - a.year || a.model.localeCompare(b.model),
  "year-asc": (a, b) => a.year - b.year || a.model.localeCompare(b.model),
};

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface UseCarFiltersResult {
  cars: Car[];
  search: string;
  setSearch: (value: string) => void;
  sort: SortKey;
  setSort: (value: SortKey) => void;
  selectedYears: number[];
  toggleYear: (year: number) => void;
  availableYears: number[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export function useCarFilters(source: Car[]): UseCarFiltersResult {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("model-asc");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const availableYears = useMemo(
    () => [...new Set(source.map((car) => car.year))].sort((a, b) => b - a),
    [source],
  );

  const toggleYear = useCallback((year: number) => {
    setSelectedYears((current) =>
      current.includes(year) ? current.filter((value) => value !== year) : [...current, year],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedYears([]);
  }, []);

  const cars = useMemo(() => {
    const term = normalize(search);

    return source
      .filter((car) => term === "" || normalize(car.model).includes(term))
      .filter((car) => selectedYears.length === 0 || selectedYears.includes(car.year))
      .sort(SORTERS[sort]);
  }, [source, search, selectedYears, sort]);

  return {
    cars,
    search,
    setSearch,
    sort,
    setSort,
    selectedYears,
    toggleYear,
    availableYears,
    hasActiveFilters: search.trim() !== "" || selectedYears.length > 0,
    clearFilters,
  };
}

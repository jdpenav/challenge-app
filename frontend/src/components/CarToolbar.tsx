import { Box, Button, Chip, InputAdornment, MenuItem, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { SORT_OPTIONS, type SortKey } from "../hooks/useCarFilters";

interface CarToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  availableYears: number[];
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function CarToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  availableYears,
  selectedYears,
  onToggleYear,
  hasActiveFilters,
  onClearFilters,
}: CarToolbarProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
        }}
      >
        <TextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by model"
          size="small"
          fullWidth
          slotProps={{
            input: {
              "aria-label": "Search by model",
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: 1 }}
        />

        <TextField
          select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          size="small"
          label="Sort by"
          sx={{ minWidth: { sm: 190 } }}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {availableYears.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            mt: 1.5,
          }}
        >
          {availableYears.map((year) => {
            const selected = selectedYears.includes(year);
            return (
              <Chip
                key={year}
                label={year}
                size="small"
                onClick={() => onToggleYear(year)}
                variant={selected ? "filled" : "outlined"}
                color={selected ? "primary" : "default"}
                aria-pressed={selected}
                sx={{ cursor: "pointer" }}
              />
            );
          })}

          {hasActiveFilters && (
            <Button size="small" onClick={onClearFilters} sx={{ ml: 0.5 }}>
              Clear filters
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

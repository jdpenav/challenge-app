import { useState } from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { Box, Button, Container, CssBaseline, ThemeProvider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { AddCarDialog } from "./components/AddCarDialog";
import { AppHeader } from "./components/AppHeader";
import { CarGrid } from "./components/CarGrid";
import { CarToolbar } from "./components/CarToolbar";
import { useCarFilters } from "./hooks/useCarFilters";
import { useCars } from "./hooks/useCars";
import { theme } from "./theme";

const client = new ApolloClient({
  uri: "/graphql", // MSW intercepts this
  cache: new InMemoryCache(),
});

function CatalogueScreen() {
  const { cars, loading, error, refetch, addCar, adding } = useCars();
  const filters = useCarFilters(cars);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppHeader
        count={loading ? undefined : filters.cars.length}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add car
          </Button>
        }
      />

      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        {!loading && !error && (
          <CarToolbar
            search={filters.search}
            onSearchChange={filters.setSearch}
            sort={filters.sort}
            onSortChange={filters.setSort}
            availableYears={filters.availableYears}
            selectedYears={filters.selectedYears}
            onToggleYear={filters.toggleYear}
            hasActiveFilters={filters.hasActiveFilters}
            onClearFilters={filters.clearFilters}
          />
        )}

        <CarGrid
          cars={filters.cars}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyMessage={
            filters.hasActiveFilters
              ? "No cars match the current filters."
              : "No cars available yet."
          }
          emptyAction={
            filters.hasActiveFilters && (
              <Button variant="outlined" onClick={filters.clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      </Container>

      <AddCarDialog
        open={dialogOpen}
        submitting={adding}
        onClose={() => setDialogOpen(false)}
        onSubmit={addCar}
      />
    </Box>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CatalogueScreen />
      </ThemeProvider>
    </ApolloProvider>
  );
}

import { Alert, Box, Button, Typography } from "@mui/material";
import type { Car } from "../types/car";
import { useCarImageSize } from "../hooks/useCarImageSize";
import { CarCard } from "./CarCard";
import { CarCardSkeleton } from "./CarCardSkeleton";

const SKELETON_COUNT = 6;

const gridSx = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    md: "repeat(3, 1fr)",
  },
} as const;

interface CarGridProps {
  cars: Car[];
  loading: boolean;
  error?: Error;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

export function CarGrid({
  cars,
  loading,
  error,
  onRetry,
  emptyMessage = "No cars available yet.",
  emptyAction,
}: CarGridProps) {
  const imageSize = useCarImageSize();

  if (loading) {
    return (
      <Box sx={gridSx} aria-busy="true" aria-label="Loading cars">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <CarCardSkeleton key={index} />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        variant="outlined"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        We could not load the cars. {error.message}
      </Alert>
    );
  }

  if (cars.length === 0) {
    return (
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 3,
          py: 8,
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="subtitle1">{emptyMessage}</Typography>
        {emptyAction && <Box sx={{ mt: 2 }}>{emptyAction}</Box>}
      </Box>
    );
  }

  return (
    <Box sx={gridSx}>
      {cars.map((car) => (
        <CarCard key={car.id} car={car} imageSize={imageSize} />
      ))}
    </Box>
  );
}

import { Box, Card, CardContent, Typography } from "@mui/material";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";
import type { Car, CarImageSize } from "../types/car";
import { swatchFor } from "../utils/carColors";

interface CarCardProps {
  car: Car;
  imageSize: CarImageSize;
}

export function CarCard({ car, imageSize }: CarCardProps) {
  const imageUrl = car[imageSize];

  return (
    <Card
      component="article"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "border-color 160ms ease",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: "4 / 3",
          bgcolor: "#F2F4F6",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={`${car.make} ${car.model}`}
            loading="lazy"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Box
            role="img"
            aria-label={`${car.make} ${car.model}, no image available`}
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "#C3C9D0",
            }}
          >
            <DirectionsCarFilledOutlinedIcon sx={{ fontSize: 44 }} />
          </Box>
        )}
      </Box>

      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="caption" component="p" sx={{ textTransform: "uppercase" }}>
          {car.make}
        </Typography>

        <Typography variant="h2" component="h3" sx={{ mt: 0.25 }}>
          {car.model}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mt: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
            <Box
              aria-hidden
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                flexShrink: 0,
                bgcolor: swatchFor(car.color),
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            <Typography variant="body2" color="text.secondary" noWrap>
              {car.color}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            {car.year}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

import { Box, Card, CardContent, Skeleton } from "@mui/material";

export function CarCardSkeleton() {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Skeleton
        variant="rectangular"
        sx={{ aspectRatio: "4 / 3", height: "auto", bgcolor: "#F2F4F6" }}
      />
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Skeleton width="35%" height={14} />
        <Skeleton width="60%" height={24} sx={{ mt: 0.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5 }}>
          <Skeleton width="30%" height={18} />
          <Skeleton width="18%" height={18} />
        </Box>
      </CardContent>
    </Card>
  );
}

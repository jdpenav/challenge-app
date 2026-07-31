import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import DirectionsCarFilledOutlinedIcon from "@mui/icons-material/DirectionsCarFilledOutlined";

interface AppHeaderProps {
  count?: number;
  action?: React.ReactNode;
}

export function AppHeader({ count, action }: AppHeaderProps) {
  return (
    <AppBar position="sticky">
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ gap: 1.5, px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 1,
              bgcolor: "primary.light",
              color: "primary.main",
            }}
          >
            <DirectionsCarFilledOutlinedIcon fontSize="small" />
          </Box>

          <Typography variant="h1" component="h1" noWrap sx={{ minWidth: 0 }}>
            Car Catalogue
          </Typography>

          {count !== undefined && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: "primary.light",
                color: "primary.main",
                fontSize: "0.8125rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {count} {count === 1 ? "car" : "cars"}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {action}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

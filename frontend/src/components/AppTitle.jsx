import { Stack, Typography } from "@mui/material";

export default function AppTitle() {
  return (
    <Stack spacing={0.7} className="app-header" alignItems="center" justifyContent="center">
      <Typography
        variant="h2"
        className="brand-title"
        sx={{
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "none",
          fontSize: { xs: "2.25rem", md: "3.2rem" },
          lineHeight: 1.03,
        }}
      >
        maze
        <span className="brand-accent">R</span>
        <span className="brand-accent">L</span>
        ab
      </Typography>
      <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 620, textAlign: "center" }}>
        Configure the maze and model, run training, and replay how the agent reaches the goal.
      </Typography>
    </Stack>
  );
}

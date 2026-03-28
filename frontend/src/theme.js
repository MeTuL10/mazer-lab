import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ff4747",
      light: "#ff6b6b",
      dark: "#bf1f2b",
    },
    secondary: {
      main: "#ff7a59",
    },
    background: {
      default: "#070506",
      paper: "#121012",
    },
    text: {
      primary: "#f7f3f4",
      secondary: "#b9aeb0",
    },
    divider: "rgba(255, 86, 86, 0.24)",
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Sora", "Space Grotesk", "Segoe UI", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "linear-gradient(165deg, rgba(30,20,22,0.95), rgba(11,9,10,0.96))",
          border: "1px solid rgba(255,85,85,0.2)",
          boxShadow: "0 18px 42px rgba(0,0,0,0.45)",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,85,85,0.18)",
          borderRadius: 14,
          marginBottom: "10px",
          "&:before": {
            display: "none",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          background: "linear-gradient(90deg, #ff3a32 0%, #ff5a3d 100%)",
          boxShadow: "0 8px 22px rgba(255,72,72,0.35)",
        },
        outlined: {
          borderColor: "rgba(255,92,92,0.4)",
          color: "#ffb5b5",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,75,75,0.16)",
          color: "#ffd9d9",
        },
      },
    },
  },
});

export default theme;

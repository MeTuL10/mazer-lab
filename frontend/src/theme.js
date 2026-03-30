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
      default: "#060507",
      paper: "#0b0a0d",
    },
    text: {
      primary: "#f7f3f4",
      secondary: "#b9aeb0",
    },
    divider: "rgba(255, 86, 86, 0.18)",
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
          backgroundImage:
            "radial-gradient(circle at 50% -32%, rgba(255,74,74,0.10) 0%, rgba(255,74,74,0.04) 36%, rgba(0,0,0,0) 60%), linear-gradient(170deg, rgba(11,10,12,0.97), rgba(5,5,7,0.98))",
          border: "1px solid rgba(255,85,85,0.16)",
          boxShadow:
            "0 18px 42px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,88,88,0.06), inset 0 16px 28px rgba(255,72,72,0.04)",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundImage:
            "radial-gradient(circle at 50% -45%, rgba(255,72,72,0.10) 0%, rgba(255,72,72,0.03) 42%, rgba(0,0,0,0) 62%), linear-gradient(175deg, rgba(10,10,12,0.94), rgba(7,7,9,0.97))",
          border: "1px solid rgba(255,85,85,0.15)",
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
          boxShadow: "0 8px 22px rgba(255,72,72,0.32)",
        },
        outlined: {
          borderColor: "rgba(255,92,92,0.36)",
          color: "#ffb5b5",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,75,75,0.14)",
          color: "#ffd9d9",
        },
      },
    },
  },
});

export default theme;

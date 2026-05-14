import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003B67', // Azul Escuro Institucional
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#068dbd', // Azul Ciano
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f7f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, color: '#003B67' },
    h2: { fontWeight: 600, color: '#003B67' },
    h3: { fontWeight: 600, color: '#003B67' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;

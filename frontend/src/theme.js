import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#003B67' : '#4fc3f7', // Azul Escuro Institucional ou Azul Claro Vibrante no dark mode
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'light' ? '#068dbd' : '#80deea', // Azul Ciano
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f4f7f6' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, color: mode === 'light' ? '#003B67' : '#4fc3f7' },
    h2: { fontWeight: 600, color: mode === 'light' ? '#003B67' : '#4fc3f7' },
    h3: { fontWeight: 600, color: mode === 'light' ? '#003B67' : '#4fc3f7' },
    h4: { fontWeight: 600, color: mode === 'light' ? '#003B67' : '#4fc3f7' },
    h5: { fontWeight: 600, color: mode === 'light' ? '#003B67' : '#4fc3f7' },
    h6: { fontWeight: 600, color: mode === 'light' ? '#003B67' : '#4fc3f7' },
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
          boxShadow: mode === 'light' ? '0 4px 12px rgba(0,0,0,0.05)' : '0 4px 12px rgba(0,0,0,0.5)',
          borderRadius: 12,
        },
      },
    },
  },
});

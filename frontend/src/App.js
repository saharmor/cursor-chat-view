import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ChatList from './components/ChatList';
import ChatDetail from './components/ChatDetail';
import Header from './components/Header';

// Define our color palette centrally
const colors = {
  primary: {
    main: '#2563EB',    // Blue 600
    light: '#60A5FA',   // Blue 400
    dark: '#1D4ED8',    // Blue 700
  },
  secondary: {
    main: '#DB467E',
    light: '#E16997',
    dark: '#C42766',
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
  },
  info: {
    main: '#0EA5E9',    // Sky blue
  },
  success: {
    main: '#22C55E',    // Green
  },
  warning: {
    main: '#F59E0B',    // Amber
  },
  error: {
    main: '#EF4444',    // Red
  },
};

// Create a modern, refined theme for the app
const modernTheme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 4px 10px -2px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

// Export the colors so they can be used in other components
export { colors };

function App() {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<ChatList />} />
          <Route path="/chat/:sessionId" element={<ChatDetail />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 
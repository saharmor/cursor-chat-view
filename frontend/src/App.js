import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ChatList from './components/ChatList';
import ChatDetail from './components/ChatDetail';
import Header from './components/Header';

// Define our color palette centrally - inspired by modern dark UI with vibrant accents
const colors = {
  primary: {
    main: '#4A89DC',    // Blue accent
    light: '#64B5F6',   // Light blue
    dark: '#2962FF',    // Dark blue
  },
  secondary: {
    main: '#F5F5F5',    // White accent
    light: '#FFFFFF',   // Pure white
    dark: '#E0E0E0',    // Light gray
  },
  tertiary: {
    main: '#52C41A',    // Green accent
    light: '#73D13D',   // Light green
    dark: '#389E0D',    // Dark green
  },
  background: {
    default: '#121212', // Dark background
    paper: '#1E1E1E',   // Slightly lighter dark for cards/elements
    gradient: 'linear-gradient(135deg, #0D2B4D 0%, #1E1E1E 50%, #1F5022 100%)', // Gradient using blue, dark, and green
  },
  text: {
    primary: '#FFFFFF',  // White text
    secondary: '#B3B3B3', // Lighter gray for secondary text
  },
  info: {
    main: '#40A9FF',    // Blue
  },
  success: {
    main: '#52C41A',    // Green
  },
  warning: {
    main: '#FAAD14',    // Amber
  },
  error: {
    main: '#F5222D',    // Red
  },
};

// Create a modern, sophisticated dark theme for the app
const modernTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
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
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          backgroundColor: colors.background.paper,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: colors.background.paper,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: colors.background.gradient,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
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
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
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
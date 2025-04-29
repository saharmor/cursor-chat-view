import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ChatList from './components/ChatList';
import ChatDetail from './components/ChatDetail';
import Header from './components/Header';

// Define our color palette centrally - using rich, modern colors
const colors = {
  primary: {
    main: '#6E2CF4',    // Rich purple
    light: '#8F58F6',   // Light purple
    dark: '#4A0DB2',    // Dark purple
  },
  secondary: {
    main: '#FF6B35',    // Vibrant orange
    light: '#FF8F5E',   // Light orange
    dark: '#E04F1D',    // Dark orange
  },
  tertiary: {
    main: '#3EBD64',    // Vibrant green
    light: '#5FD583',   // Light green
    dark: '#2A9E4A',    // Dark green
  },
  background: {
    default: '#121212', // Dark background
    paper: '#1E1E1E',   // Slightly lighter dark for cards/elements
    gradient: 'linear-gradient(135deg, #6E2CF4 0%, #FF6B35 50%, #3EBD64 100%)', // Gradient from purple to orange to green
  },
  text: {
    primary: '#FFFFFF',  // White text
    secondary: '#B3B3B3', // Lighter gray for secondary text
  },
  info: {
    main: '#39C0F7',    // Bright blue
  },
  success: {
    main: '#3EBD64',    // Green
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'transparent',
            },
            '&.Mui-focused': {
              backgroundColor: 'transparent',
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
          color: 'white',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
        },
        outlined: {
          color: 'white',
          borderColor: 'rgba(255,255,255,0.5)',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.8)',
          }
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
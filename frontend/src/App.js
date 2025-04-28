import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ChatList from './components/ChatList';
import ChatDetail from './components/ChatDetail';
import Header from './components/Header';

// Create a dark theme for the app
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#58a6ff',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
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
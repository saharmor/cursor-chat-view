import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

const Header = () => {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <ChatIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div">
            Cursor Chat History
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Container, Button } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import GitHubIcon from '@mui/icons-material/GitHub';

const Header = () => {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Container>
        <Toolbar sx={{ p: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 0 } }}>
          <Box component={Link} to="/" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: 'inherit',
            flexGrow: 1,
            '&:hover': {
              textDecoration: 'none'
            }
          }}>
            <ChatIcon sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography variant="h5" component="div" fontWeight="700">
              Cursor View
            </Typography>
          </Box>
          
          <Button 
            component="a"
            href="https://github.com/saharmor/cursor-chat-view"
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<GitHubIcon />}
            variant="outlined"
            color="inherit"
            size="small"
            sx={{ 
              borderColor: 'rgba(255,255,255,0.5)', 
              color: 'white',
              '&:hover': { 
                borderColor: 'rgba(255,255,255,0.8)',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            GitHub
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MessageIcon from '@mui/icons-material/Message';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/chats');
      const chatData = response.data;
      
      // Check if these are sample chats (demo data)
      const isSampleData = chatData.length > 0 && chatData[0].session_id?.startsWith('sample');
      setIsDemo(isSampleData);
      
      setChats(chatData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Group chats by project
  const chatsByProject = chats.reduce((acc, chat) => {
    const projectName = chat.project?.name || 'Unknown Project';
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(chat);
    return acc;
  }, {});

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Error: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Your Cursor Chat History
      </Typography>
      
      {isDemo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Currently showing demo data. No actual Cursor chat history was found on your system.
          </Typography>
          <Typography variant="body2">
            Cursor chat databases are typically stored in:
            <Box component="ul" sx={{ mt: 1, ml: 2 }}>
              <li>Mac: ~/Library/Application Support/Cursor/User/globalStorage/cursor.cursor</li>
              <li>Windows: %APPDATA%\Cursor\User\globalStorage\cursor.cursor</li>
              <li>Linux: ~/.config/Cursor/User/globalStorage/cursor.cursor</li>
            </Box>
          </Typography>
          <Button 
            startIcon={<RefreshIcon />}
            onClick={fetchChats}
            sx={{ mt: 1 }}
            size="small"
            variant="outlined"
          >
            Refresh
          </Button>
        </Alert>
      )}
      
      {Object.keys(chatsByProject).length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <InfoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Chat History Found
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            We couldn't find any Cursor chat history on your system. This could be because:
          </Typography>
          <Box sx={{ textAlign: 'left', maxWidth: '600px', mx: 'auto' }}>
            <Typography component="ul" variant="body2" sx={{ mb: 2 }}>
              <li>You haven't used Cursor's AI Assistant yet</li>
              <li>Your Cursor databases are stored in a non-standard location</li>
              <li>There might be permission issues accessing the database files</li>
            </Typography>
          </Box>
          <Button 
            startIcon={<RefreshIcon />}
            onClick={fetchChats}
            variant="contained"
            color="primary"
          >
            Retry Detection
          </Button>
        </Paper>
      ) : (
        Object.entries(chatsByProject).map(([projectName, projectChats]) => (
          <Box key={projectName} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FolderIcon sx={{ mr: 1 }} />
              <Typography variant="h5">{projectName}</Typography>
              <Chip 
                label={`${projectChats.length} ${projectChats.length === 1 ? 'chat' : 'chats'}`} 
                size="small" 
                sx={{ ml: 2 }} 
              />
            </Box>
            
            <Grid container spacing={3}>
              {projectChats.map((chat, index) => {
                // Format the date safely
                let dateDisplay = 'Unknown date';
                try {
                  if (chat.date) {
                    const dateObj = new Date(chat.date * 1000);
                    // Check if date is valid
                    if (!isNaN(dateObj.getTime())) {
                      dateDisplay = dateObj.toLocaleString();
                    }
                  }
                } catch (err) {
                  console.error('Error formatting date:', err);
                }

                return (
                  <Grid item xs={12} sm={6} md={4} key={chat.session_id || `chat-${index}`}>
                    <Card 
                      component={Link} 
                      to={`/chat/${chat.session_id}`}
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        textDecoration: 'none',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            {dateDisplay}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MessageIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {Array.isArray(chat.messages) ? chat.messages.length : 0} messages
                          </Typography>
                        </Box>
                        
                        {Array.isArray(chat.messages) && chat.messages[0] && chat.messages[0].content && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mt: 2, 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              color: 'text.secondary'
                            }}
                          >
                            {typeof chat.messages[0].content === 'string' 
                              ? chat.messages[0].content.substring(0, 100) + (chat.messages[0].content.length > 100 ? '...' : '')
                              : 'Content unavailable'}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))
      )}
    </Container>
  );
};

export default ChatList; 
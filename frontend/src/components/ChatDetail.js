import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const ChatDetail = () => {
  const { sessionId } = useParams();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await axios.get(`/api/chat/${sessionId}`);
        setChat(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChat();
  }, [sessionId]);

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

  if (!chat) {
    return (
      <Container>
        <Typography variant="h5">
          Chat not found
        </Typography>
      </Container>
    );
  }

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

  // Ensure messages exist
  const messages = Array.isArray(chat.messages) ? chat.messages : [];

  return (
    <Container sx={{ mb: 6 }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to all chats
      </Button>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <FolderIcon sx={{ mr: 1 }} />
          <Typography variant="h5" sx={{ mr: 2 }}>
            {chat.project?.name || 'Unknown Project'}
          </Typography>
          <Chip
            icon={<CalendarTodayIcon />}
            label={dateDisplay}
            variant="outlined"
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {chat.project?.rootPath || 'Unknown location'}
        </Typography>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Conversation
      </Typography>

      {messages.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No messages found in this conversation.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 4 }}>
          {messages.map((message, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                    width: 28,
                    height: 28,
                    mr: 1,
                    fontSize: 14
                  }}
                >
                  {message.role === 'user' ? 'U' : 'A'}
                </Avatar>
                <Typography variant="subtitle1">
                  {message.role === 'user' ? 'You' : 'Cursor Assistant'}
                </Typography>
              </Box>
              
              <Paper 
                sx={{ 
                  p: 2, 
                  ml: message.role === 'user' ? 0 : 4,
                  mr: message.role === 'assistant' ? 0 : 4,
                  backgroundColor: message.role === 'user' ? 'background.paper' : 'background.default',
                  borderLeft: message.role === 'assistant' ? '4px solid' : 'none',
                  borderColor: 'secondary.main'
                }}
              >
                <Box sx={{ 
                  '& pre': { maxWidth: '100%', overflowX: 'auto' },
                  '& code': { display: 'inline-block', maxWidth: '100%', overflowX: 'auto' },
                  '& img': { maxWidth: '100%' },
                }}>
                  {typeof message.content === 'string' ? (
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <Typography>Content unavailable</Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default ChatDetail; 
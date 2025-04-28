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
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { colors } from '../App';

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
  const projectName = chat.project?.name || 'Unknown Project';

  return (
    <Container sx={{ mb: 6 }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        color="primary"
        sx={{ mb: 3, mt: 2, borderRadius: 2 }}
      >
        Back to all chats
      </Button>

      <Paper 
        sx={{ 
          p: 0, 
          mb: 4, 
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ 
          background: `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
          color: 'white',
          p: 2.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <FolderIcon sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography variant="h5" fontWeight="600" sx={{ mr: 2 }}>
              {projectName}
            </Typography>
            <Chip
              icon={<CalendarTodayIcon />}
              label={dateDisplay}
              size="small"
              sx={{ 
                fontWeight: 500,
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' },
                '& .MuiChip-label': { px: 1 }
              }}
            />
          </Box>
        </Box>
        
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            mb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountTreeIcon sx={{ mr: 1, color: 'primary.main', opacity: 0.8 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Path:</strong> {chat.project?.rootPath || 'Unknown location'}
              </Typography>
            </Box>
            
            {chat.workspace_id && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StorageIcon sx={{ mr: 1, color: 'secondary.main', opacity: 0.8 }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Workspace:</strong> {chat.workspace_id}
                </Typography>
              </Box>
            )}
          </Box>
          
          {chat.db_path && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: alpha('#000', 0.06) }}>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                <strong>Database:</strong> {chat.db_path}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom fontWeight="600" sx={{ mt: 4, mb: 3 }}>
        Conversation History
      </Typography>

      {messages.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="body1">
            No messages found in this conversation.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 4 }}>
          {messages.map((message, index) => (
            <Box key={index} sx={{ mb: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32,
                    mr: 1.5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="600">
                  {message.role === 'user' ? 'You' : 'Cursor Assistant'}
                </Typography>
              </Box>
              
              <Paper 
                elevation={1}
                sx={{ 
                  p: 2.5, 
                  ml: message.role === 'user' ? 0 : 5,
                  mr: message.role === 'assistant' ? 0 : 5,
                  backgroundColor: message.role === 'user' 
                    ? alpha(colors.primary.main, 0.04) 
                    : alpha(colors.secondary.main, 0.04),
                  borderLeft: '4px solid',
                  borderColor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                  borderRadius: 2
                }}
              >
                <Box sx={{ 
                  '& pre': { 
                    maxWidth: '100%', 
                    overflowX: 'auto',
                    backgroundColor: message.role === 'user' 
                      ? alpha(colors.primary.main, 0.07) 
                      : alpha(colors.secondary.main, 0.07),
                    borderRadius: 1,
                    p: 2
                  },
                  '& code': { 
                    display: 'inline-block', 
                    maxWidth: '100%', 
                    overflowX: 'auto',
                    backgroundColor: message.role === 'user' 
                      ? alpha(colors.primary.main, 0.07) 
                      : alpha(colors.secondary.main, 0.07),
                    borderRadius: 0.5,
                    px: 0.8,
                    py: 0.2
                  },
                  '& img': { maxWidth: '100%' },
                  '& ul, & ol': { pl: 3 },
                  '& a': { 
                    color: message.role === 'user' ? 'primary.main' : 'secondary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }
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
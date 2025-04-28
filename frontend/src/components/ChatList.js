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
  Collapse,
  IconButton,
  alpha,
  TextField,
  InputAdornment,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MessageIcon from '@mui/icons-material/Message';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { colors } from '../App';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

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

  const toggleProjectExpand = (projectName) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectName]: !prev[projectName]
    }));
  };

  // Filter chats based on search query
  const filteredChatsByProject = () => {
    if (!searchQuery.trim()) {
      return chats.reduce((acc, chat) => {
        const projectName = chat.project?.name || 'Unknown Project';
        
        if (!acc[projectName]) {
          acc[projectName] = {
            name: projectName,
            path: chat.project?.rootPath || 'Unknown',
            chats: []
          };
        }
        
        if (chat.project?.rootPath && 
            acc[projectName].path === 'Unknown') {
          acc[projectName].path = chat.project.rootPath;
        }
        
        acc[projectName].chats.push(chat);
        return acc;
      }, {});
    }

    const query = searchQuery.toLowerCase();
    return chats.reduce((acc, chat) => {
      const projectName = chat.project?.name || 'Unknown Project';
      
      // Check if project name matches
      const projectMatches = projectName.toLowerCase().includes(query);
      
      // Check if any message content matches
      const contentMatches = Array.isArray(chat.messages) && chat.messages.some(msg => 
        typeof msg.content === 'string' && msg.content.toLowerCase().includes(query)
      );
      
      if (projectMatches || contentMatches) {
        if (!acc[projectName]) {
          acc[projectName] = {
            name: projectName,
            path: chat.project?.rootPath || 'Unknown',
            chats: []
          };
        }
        
        if (chat.project?.rootPath && 
            acc[projectName].path === 'Unknown') {
          acc[projectName].path = chat.project.rootPath;
        }
        
        acc[projectName].chats.push(chat);
      }
      
      return acc;
    }, {});
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    
    // Auto-expand all projects when searching
    if (event.target.value.trim()) {
      const expandAll = {};
      chats.forEach(chat => {
        const projectName = chat.project?.name || 'Unknown Project';
        expandAll[projectName] = true;
      });
      setExpandedProjects(expandAll);
    }
  };

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

  const chatsByProject = filteredChatsByProject();

  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ mt: 3, fontWeight: 700 }}>
        Your Cursor Chat History
      </Typography>
      
      {/* Search Bar */}
      <Paper sx={{ p: 1.5, mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by project name or chat content..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="clear search"
                  onClick={clearSearch}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: 2 }
          }}
        />
      </Paper>
      
      {isDemo && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
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
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 4,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <InfoIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight="600">
            {searchQuery ? 'No Results Found' : 'No Chat History Found'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {searchQuery 
              ? `We couldn't find any chats matching "${searchQuery}".`
              : "We couldn't find any Cursor chat history on your system. This could be because:"}
          </Typography>
          {!searchQuery && (
            <Box sx={{ textAlign: 'left', maxWidth: '600px', mx: 'auto' }}>
              <Typography component="ul" variant="body2" sx={{ mb: 2 }}>
                <li>You haven't used Cursor's AI Assistant yet</li>
                <li>Your Cursor databases are stored in a non-standard location</li>
                <li>There might be permission issues accessing the database files</li>
              </Typography>
            </Box>
          )}
          {searchQuery ? (
            <Button 
              startIcon={<ClearIcon />}
              onClick={clearSearch}
              variant="contained"
              color="primary"
              size="large"
              sx={{ borderRadius: 2 }}
            >
              Clear Search
            </Button>
          ) : (
            <Button 
              startIcon={<RefreshIcon />}
              onClick={fetchChats}
              variant="contained"
              color="primary"
              size="large"
              sx={{ borderRadius: 2 }}
            >
              Retry Detection
            </Button>
          )}
        </Paper>
      ) : (
        Object.entries(chatsByProject).map(([projectName, projectData]) => {
          return (
            <Box key={projectName} sx={{ mb: 4 }}>
              <Paper 
                sx={{ 
                  p: 0, 
                  mb: 2, 
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }
                }}
              >
                <Box 
                  sx={{ 
                    background: `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
                    color: 'white',
                    p: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FolderIcon sx={{ mr: 1.5, fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {projectData.name}
                      </Typography>
                      <Chip 
                        label={`${projectData.chats.length} ${projectData.chats.length === 1 ? 'chat' : 'chats'}`} 
                        size="small" 
                        sx={{ 
                          ml: 2,
                          fontWeight: 500,
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          color: 'white',
                          '& .MuiChip-label': {
                            px: 1.5
                          }
                        }} 
                      />
                    </Box>
                    <IconButton 
                      onClick={() => toggleProjectExpand(projectName)}
                      aria-expanded={expandedProjects[projectName]}
                      aria-label="show more"
                      sx={{ 
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.15)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.25)'
                        }
                      }}
                    >
                      {expandedProjects[projectName] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                    {projectData.path}
                  </Typography>
                </Box>
              </Paper>
              
              <Collapse in={expandedProjects[projectName] || false}>
                <Grid container spacing={3}>
                  {projectData.chats.map((chat, index) => {
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
                            transition: 'all 0.3s cubic-bezier(.17,.67,.83,.67)',
                            textDecoration: 'none',
                            borderTop: '4px solid',
                            borderColor: 'primary.main',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                            }
                          }}
                        >
                          <CardContent>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 1.5,
                              justifyContent: 'space-between'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {dateDisplay}
                                </Typography>
                              </Box>
                              <CodeIcon fontSize="small" sx={{ color: alpha(colors.primary.main, 0.7) }} />
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                              <MessageIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="body2" fontWeight="500">
                                {Array.isArray(chat.messages) ? chat.messages.length : 0} messages
                              </Typography>
                            </Box>
                            
                            {chat.db_path && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  display: 'block',
                                  mb: 1.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                DB: {chat.db_path.split('/').slice(-2).join('/')}
                              </Typography>
                            )}
                            
                            {Array.isArray(chat.messages) && chat.messages[0] && chat.messages[0].content && (
                              <Box sx={{ 
                                mt: 2, 
                                p: 1.5, 
                                backgroundColor: alpha(colors.primary.main, 0.05),
                                borderRadius: 2
                              }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    color: 'text.primary',
                                    fontWeight: 400
                                  }}
                                >
                                  {typeof chat.messages[0].content === 'string' 
                                    ? chat.messages[0].content.substring(0, 100) + (chat.messages[0].content.length > 100 ? '...' : '')
                                    : 'Content unavailable'}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Collapse>
            </Box>
          );
        })
      )}
    </Container>
  );
};

export default ChatList; 
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
  CardActions,
  Tooltip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MessageIcon from '@mui/icons-material/Message';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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

  // Handle export
  const handleExport = async (e, sessionId) => {
    // Prevent navigation to chat detail
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log("Starting HTML export for session:", sessionId);
      console.log(`Making API request to: /api/chat/${sessionId}/export`);
      
      const response = await axios({
        method: 'GET',
        url: `/api/chat/${sessionId}/export`,
        responseType: 'text', 
        headers: {
          'Accept': 'text/html'
        }
      });
      
      const content = response.data;
      console.log("Received content length:", content ? content.length : 0);
      
      if (!content || content.length === 0) {
        throw new Error("Received empty or invalid content from server");
      }
      
      // Create a Blob with explicit UTF-8 encoding type
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      console.log("Created blob, size:", blob.size);

      // --- Download Logic Start ---
      const filename = `cursor-chat-${sessionId.slice(0, 8)}.html`;
      const link = document.createElement('a');
      
      // Create an object URL for the blob
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      
      // Append link to the body (required for Firefox)
      document.body.appendChild(link);
      
      // Programmatically click the link to trigger the download
      link.click();
      
      // Clean up: remove the link and revoke the object URL
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("Download initiated and cleanup complete");
      // --- Download Logic End ---
      
    } catch (error) {
      // ADDED: More detailed error logging
      console.error('Detailed export error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser
        console.error('Error Request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
      }
      console.error('Error Config:', error.config);
      
      const errorMessage = error.response ? 
        `Server error: ${error.response.status}` : 
        error.request ? 
        'No response received from server' : 
        error.message || 'Unknown error setting up request';
      alert(`Failed to export chat: ${errorMessage}`);
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
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by project name or chat content..."
        value={searchQuery}
        onChange={handleSearchChange}
        size="medium"
        sx={{ mb: 3 }}
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
                    background: colors.background.paper,
                    borderBottom: '1px solid',
                    borderColor: alpha(colors.text.secondary, 0.1),
                    color: colors.text.primary,
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(colors.secondary.main, 0.02)
                    }
                  }}
                  onClick={() => toggleProjectExpand(projectName)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FolderIcon sx={{ mr: 1.5, fontSize: 28, color: colors.text.secondary }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {projectData.name}
                      </Typography>
                      <Chip 
                        label={`${projectData.chats.length} ${projectData.chats.length === 1 ? 'chat' : 'chats'}`} 
                        size="small" 
                        sx={{ 
                          ml: 2,
                          fontWeight: 500,
                          backgroundColor: alpha(colors.secondary.main, 0.1),
                          color: colors.text.primary,
                          '& .MuiChip-label': {
                            px: 1.5
                          }
                        }} 
                      />
                    </Box>
                    <IconButton 
                      aria-expanded={expandedProjects[projectName]}
                      aria-label="show more"
                      sx={{ 
                        color: colors.text.primary,
                        bgcolor: alpha(colors.secondary.main, 0.05),
                        '&:hover': {
                          bgcolor: alpha(colors.secondary.main, 0.1)
                        }
                      }}
                      onClick={(e) => {
                        // Prevent the click from reaching the parent Box
                        e.stopPropagation();
                        toggleProjectExpand(projectName);
                      }}
                    >
                      {expandedProjects[projectName] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  <Typography variant="body2" sx={{ color: colors.text.secondary, mt: 0.5 }}>
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
                            borderTop: '1px solid',
                            borderColor: alpha(colors.text.secondary, 0.1),
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
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                              <MessageIcon fontSize="small" sx={{ mr: 1, color: colors.text.secondary }} />
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
                                backgroundColor: alpha(colors.secondary.main, 0.05),
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: alpha(colors.text.secondary, 0.05)
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
                          <CardActions sx={{ mt: 'auto', pt: 0 }}>
                            <Tooltip title="Export as HTML">
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleExport(e, chat.session_id)}
                                sx={{ ml: 'auto' }}
                              >
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </CardActions>
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
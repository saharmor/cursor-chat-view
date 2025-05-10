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
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { colors } from '../App';
import { exportChat, exportPreferences } from '../utils/exportUtils';
import { FormatSelectionDialog, ExportWarningDialog } from './ExportDialogs';

const ChatDetail = () => {
  const { sessionId } = useParams();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('html');
  const [dontShowExportWarning, setDontShowExportWarning] = useState(false);

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
    
    // Check if user has previously chosen to not show the export warning
    setDontShowExportWarning(exportPreferences.getDontShowWarning());
  }, [sessionId]);

  const handleFormatDialogClose = (confirmed) => {
    setFormatDialogOpen(false);
    
    if (confirmed) {
      // After format selection, show warning dialog or proceed directly
      if (dontShowExportWarning) {
        proceedWithExport();
      } else {
        setExportModalOpen(true);
      }
    }
  };

  // Handle export warning confirmation
  const handleExportWarningClose = (confirmed) => {
    setExportModalOpen(false);
    
    // Save preference in cookies if "Don't show again" is checked
    if (dontShowExportWarning) {
      exportPreferences.saveDontShowWarning(true);
    }
    
    // If confirmed, proceed with export
    if (confirmed) {
      proceedWithExport();
    }
  };

  // Function to initiate export process
  const handleExport = () => {
    // First open format selection dialog
    setFormatDialogOpen(true);
  };

  // Function to actually perform the export
  const proceedWithExport = async () => {
    await exportChat(sessionId, exportFormat);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress sx={{ color: colors.highlightColor }} />
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
      {/* Use the reusable dialog components */}
      <FormatSelectionDialog 
        open={formatDialogOpen}
        onClose={handleFormatDialogClose}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        colors={colors}
      />
      
      <ExportWarningDialog
        open={exportModalOpen}
        onClose={handleExportWarningClose}
        dontShowWarning={dontShowExportWarning}
        setDontShowWarning={setDontShowExportWarning}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 2 }}>
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            color: 'white'
          }}
        >
          Back to all chats
        </Button>
        
        <Button
          onClick={handleExport}
          startIcon={<FileDownloadIcon />}
          variant="contained"
          color="highlight"
          sx={{ 
            borderRadius: 2,
            position: 'relative',
            '&:hover': {
              backgroundColor: alpha(colors.highlightColor, 0.8),
            },
            '&::after': dontShowExportWarning ? null : {
              content: '""',
              position: 'absolute',
              borderRadius: '50%',
              top: '4px',
              right: '4px',
              width: '8px', // Adjusted size for button
              height: '8px' // Adjusted size for button
            },
            // Conditionally add the background color if the warning should be shown
            ...( !dontShowExportWarning && {
              '&::after': { 
                backgroundColor: 'warning.main'
              }
            })
          }}
        >
          Export
        </Button>
      </Box>

      <Paper 
        sx={{ 
          p: 0, 
          mb: 3, 
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ 
          background: `linear-gradient(90deg, ${colors.highlightColor} 0%, ${colors.highlightColor.light} 100%)`,
          color: 'white',
          px: 3,
          py: 1.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <FolderIcon sx={{ mr: 1, fontSize: 22 }} />
            <Typography variant="h6" fontWeight="600" sx={{ mr: 1.5 }}>
              {projectName}
            </Typography>
            <Chip
              icon={<CalendarTodayIcon />}
              label={dateDisplay}
              size="small"
              sx={{ 
                fontWeight: 500,
                color: 'white',
                '& .MuiChip-icon': { color: 'white' },
                '& .MuiChip-label': { px: 1 }
              }}
            />
          </Box>
        </Box>
        
        <Box sx={{ px: 3, py: 1.5 }}>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2,
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountTreeIcon sx={{ mr: 0.5, color: colors.highlightColor, opacity: 0.8, fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Path:</strong> {chat.project?.rootPath || 'Unknown location'}
              </Typography>
            </Box>
            
            {chat.workspace_id && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StorageIcon sx={{ mr: 0.5, color: colors.highlightColor, opacity: 0.8, fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Workspace:</strong> {chat.workspace_id}
                </Typography>
              </Box>
            )}
            
            {chat.db_path && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DataObjectIcon sx={{ mr: 0.5, color: colors.highlightColor, opacity: 0.8, fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  <strong>DB:</strong> {chat.db_path.split('/').pop()}
                </Typography>
              </Box>
            )}
          </Box>
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
        messages.map((message, index) => {
          const isUser = message.role === 'user';
          const bgColor = isUser ? alpha(colors.highlightColor, 0.08) : alpha('#e6f7e6', 0.8);
          const borderColor = isUser ? colors.highlightColor : '#4CAF50';

          return (
            <Paper 
              key={`msg-${index}`} 
              sx={{ 
                mb: 3, 
                p: 2.5, 
                borderRadius: 3,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${borderColor}`,
                backgroundColor: bgColor,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                <Avatar 
                  sx={{ 
                    mr: 1.5, 
                    width: 32, 
                    height: 32,
                    backgroundColor: isUser ? colors.highlightColor : '#4CAF50',
                  }}
                >
                  {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                </Avatar>
                <Typography variant="subtitle2" fontWeight="600">
                  {isUser ? 'You' : 'Cursor AI'}
                </Typography>
              </Box>
              
              <Box sx={{ pl: 5.5 }}>
                {typeof message.content === 'string' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <Typography>Content unavailable</Typography>
                )}
              </Box>
            </Paper>
          );
        })
      )}
    </Container>
  );
};

export default ChatDetail; 
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import axios from 'axios';

// Create a context for our chat data
const ChatDataContext = createContext();

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of chats to cache

/**
 * Provider component that wraps your app and makes chat data available to any
 * child component that calls useChatData().
 */
export function ChatDataProvider({ children }) {
  // State for all chats
  const [chats, setChats] = useState([]);
  const [chatCache, setChatCache] = useState({}); // Cache for individual chats
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [showDemoChats, setShowDemoChats] = useState(false);

  // Load demo chats preference from localStorage
  useEffect(() => {
    const savedShowDemoChats = localStorage.getItem('showDemoChats') === 'true';
    setShowDemoChats(savedShowDemoChats);
  }, []);

  // Function to toggle demo chats visibility
  const toggleDemoChats = useCallback(() => {
    const newValue = !showDemoChats;
    setShowDemoChats(newValue);
    localStorage.setItem('showDemoChats', newValue ? 'true' : 'false');
    // Invalidate cache when toggling demo chats
    setLastFetched(null);
  }, [showDemoChats]);

  // Function to fetch all chats with caching
  const fetchChats = useCallback(async (forceRefresh = false) => {
    // Check if we have cached data and it's still fresh
    const now = Date.now();
    if (
      !forceRefresh &&
      lastFetched &&
      chats.length > 0 &&
      now - lastFetched < CACHE_TTL
    ) {
      return { chats, isDemo };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/chats');
      const chatData = response.data;
      
      // Check if these are sample chats (demo data)
      const isSampleData = chatData.length > 0 && chatData[0].session_id?.startsWith('sample');
      setIsDemo(isSampleData);
      
      // FOR DEMO: Add extra projects with multiple sessions if showDemoChats is true
      let combinedData = chatData;
      
      if (showDemoChats) {
        const demoProjects = createDemoChats();
        combinedData = [...demoProjects, ...chatData];
      }

      setChats(combinedData);
      setLastFetched(now);
      setLoading(false);
      return { chats: combinedData, isDemo: isSampleData };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [chats, lastFetched, isDemo, showDemoChats]);

  // Function to create demo chats
  const createDemoChats = useCallback(() => {
    const createDemoSessions = (projectName, projectPath, workspaceId, numSessions) => {
      const sessions = [];
      for (let i = 1; i <= numSessions; i++) {
        const numMessages = Math.floor(Math.random() * 25) + 5; // 5 to 30 messages
        const messages = Array.from({ length: numMessages }, (_, index) => ({
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: `Demo Message ${index + 1} in session ${i} for ${projectName}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          timestamp: Date.now() / 1000 - (index * Math.random() * 7200 + 60), // Simulate messages over time with randomness
        }));
        
        sessions.push({
          project: { name: projectName, rootPath: projectPath, workspace_id: workspaceId },
          messages: messages,
          date: Date.now() / 1000 - (i * 86400 * Math.random()), // Vary session dates slightly
          session_id: `demo-session-${projectName.toLowerCase().replace(/\s+/g, '-')}-${i}`,
          workspace_id: workspaceId,
          db_path: `demo/db/path/${projectName}` // Simplified demo path
        });
      }
      return sessions;
    };

    return [
      ...createDemoSessions("dolores-voice-eval", "/Users/saharm/Documents/codebase/dolores-voice-eval", "demo-voice-eval", 3),
      ...createDemoSessions("dolores-agent", "/Users/saharm/Documents/codebase/dolores-agent", "demo-agent", 4)
    ];
  }, []);

  // Function to fetch a single chat with caching
  const fetchChat = useCallback(async (sessionId, forceRefresh = false) => {
    // Check if we have this chat in the cache and it's still fresh
    const now = Date.now();
    if (
      !forceRefresh &&
      chatCache[sessionId]?.data &&
      now - chatCache[sessionId].timestamp < CACHE_TTL
    ) {
      return chatCache[sessionId].data;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if this is a demo chat
      if (sessionId.startsWith('demo-session-')) {
        // Find the demo chat in our chats array
        const demoChat = chats.find(chat => chat.session_id === sessionId);
        if (demoChat) {
          // Update cache
          setChatCache(prev => {
            const newCache = { ...prev };
            newCache[sessionId] = { data: demoChat, timestamp: now };
            
            // Prune cache if it gets too large
            if (Object.keys(newCache).length > MAX_CACHE_SIZE) {
              const oldestKey = Object.keys(newCache).sort(
                (a, b) => newCache[a].timestamp - newCache[b].timestamp
              )[0];
              delete newCache[oldestKey];
            }
            
            return newCache;
          });
          
          setLoading(false);
          return demoChat;
        }
      }
      
      const response = await axios.get(`/api/chat/${sessionId}`);
      const chatData = response.data;
      
      // Update cache
      setChatCache(prev => {
        const newCache = { ...prev };
        newCache[sessionId] = { data: chatData, timestamp: now };
        
        // Prune cache if it gets too large
        if (Object.keys(newCache).length > MAX_CACHE_SIZE) {
          const oldestKey = Object.keys(newCache).sort(
            (a, b) => newCache[a].timestamp - newCache[b].timestamp
          )[0];
          delete newCache[oldestKey];
        }
        
        return newCache;
      });
      
      setLoading(false);
      return chatData;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [chats, chatCache]);

  // Function to search chats
  const searchChats = useCallback((query) => {
    if (!query.trim()) return chats;
    
    const searchQuery = query.toLowerCase();
    return chats.filter(chat => {
      // Check if project name matches
      const projectMatches = chat.project?.name?.toLowerCase().includes(searchQuery);
      
      // Check if any message content matches
      const contentMatches = Array.isArray(chat.messages) && chat.messages.some(msg => 
        typeof msg.content === 'string' && msg.content.toLowerCase().includes(searchQuery)
      );
      
      return projectMatches || contentMatches;
    });
  }, [chats]);

  // Function to export a chat
  const exportChat = useCallback(async (sessionId, format = 'html') => {
    try {
      const response = await axios.get(
        `/api/chat/${sessionId}/export?format=${format}`,
        { responseType: 'blob' }
      );

      const blob = response.data;

      if (!blob || blob.size === 0) {
        throw new Error('Received empty or invalid content from server');
      }

      // Ensure the blob has the correct MIME type
      const mimeType = format === 'json' ? 'application/json;charset=utf-8' : 'text/html;charset=utf-8';
      const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });

      // Download Logic
      const extension = format === 'json' ? 'json' : 'html';
      const filename = `cursor-chat-${sessionId.slice(0, 8)}.${extension}`;
      const link = document.createElement('a');
      
      const url = URL.createObjectURL(typedBlob);
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err) {
      console.error('Export failed:', err);
      throw err;
    }
  }, []);

  // Group chats by project
  const chatsByProject = useCallback(() => {
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
  }, [chats]);

  // Invalidate cache for a specific chat
  const invalidateChatCache = useCallback((sessionId) => {
    setChatCache(prev => {
      const newCache = { ...prev };
      delete newCache[sessionId];
      return newCache;
    });
  }, []);

  // Invalidate all cache
  const invalidateAllCache = useCallback(() => {
    setLastFetched(null);
    setChatCache({});
  }, []);

  // Memoize the context value to prevent unnecessary renders
  const value = {
    chats,
    loading,
    error,
    isDemo,
    showDemoChats,
    fetchChats,
    fetchChat,
    searchChats,
    exportChat,
    chatsByProject,
    toggleDemoChats,
    invalidateChatCache,
    invalidateAllCache
  };

  return (
    <ChatDataContext.Provider value={value}>
      {children}
    </ChatDataContext.Provider>
  );
}

/**
 * Hook that lets any component easily access the chat data and related functions.
 */
export function useChatData() {
  const context = useContext(ChatDataContext);
  if (context === undefined) {
    throw new Error('useChatData must be used within a ChatDataProvider');
  }
  return context;
}

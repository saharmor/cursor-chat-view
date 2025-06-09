#!/usr/bin/env python3
"""
Repository pattern implementation for Cursor View.
This module provides a clean abstraction for database access with caching.
"""

import json
import sqlite3
import logging
import pathlib
import time
from typing import Dict, List, Any, Optional, Tuple, Iterable, Set, Union
from functools import lru_cache
import threading
from datetime import datetime, timedelta

from models import ChatSession, Project, Message, ChatSessionList

# Configure logging
logger = logging.getLogger(__name__)

class CacheStats:
    """Simple class to track cache statistics."""
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.last_reset = time.time()
    
    def record_hit(self):
        self.hits += 1
    
    def record_miss(self):
        self.misses += 1
    
    def hit_ratio(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0
    
    def reset(self):
        self.hits = 0
        self.misses = 0
        self.last_reset = time.time()
    
    def stats_dict(self) -> Dict[str, Any]:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio": self.hit_ratio(),
            "last_reset": self.last_reset
        }


class CursorRepository:
    """Repository for accessing Cursor chat data."""
    
    def __init__(self, cache_ttl: int = 300, cache_size: int = 128):
        """
        Initialize the repository.
        
        Args:
            cache_ttl: Time-to-live for cache entries in seconds
            cache_size: Maximum number of items to keep in the cache
        """
        self.cache_ttl = cache_ttl
        self.cache_size = cache_size
        self.cache_stats = CacheStats()
        self.last_refresh = time.time()
        self._cache_lock = threading.RLock()
        
        # Initialize the cache
        self._init_cache()
    
    def _init_cache(self):
        """Initialize the cache with appropriate decorators."""
        # Create a cache for the extract_chats method
        self._cached_extract_chats = lru_cache(maxsize=self.cache_size)(self._extract_chats_impl)
        
        # Create a cache for individual chat sessions
        self._cached_get_chat = lru_cache(maxsize=self.cache_size)(self._get_chat_impl)
    
    def invalidate_cache(self):
        """Invalidate all caches."""
        with self._cache_lock:
            logger.info("Invalidating repository cache")
            self._cached_extract_chats.cache_clear()
            self._cached_get_chat.cache_clear()
            self.cache_stats.reset()
    
    def should_refresh_cache(self) -> bool:
        """Check if the cache should be refreshed based on TTL."""
        return (time.time() - self.last_refresh) > self.cache_ttl
    
    def refresh_if_needed(self):
        """Refresh the cache if needed based on TTL."""
        if self.should_refresh_cache():
            self.invalidate_cache()
            self.last_refresh = time.time()
    
    def get_all_chats(self) -> ChatSessionList:
        """
        Get all chat sessions with caching.
        
        Returns:
            ChatSessionList: A list of all chat sessions
        """
        self.refresh_if_needed()
        
        start_time = time.time()
        
        # Check if we have a cached result
        cache_key = "all_chats"
        with self._cache_lock:
            try:
                # Use the cached implementation
                chats = self._cached_extract_chats(cache_key)
                self.cache_stats.record_hit()
                logger.debug(f"Cache hit for all_chats")
            except Exception as e:
                self.cache_stats.record_miss()
                logger.debug(f"Cache miss for all_chats: {e}")
                # If there's an error, try without cache
                chats = self._extract_chats_impl(cache_key)
        
        elapsed = time.time() - start_time
        logger.info(f"Retrieved {len(chats.sessions)} chats in {elapsed:.3f}s (cache hit ratio: {self.cache_stats.hit_ratio():.2f})")
        
        return chats
    
    def get_chat(self, session_id: str) -> Optional[ChatSession]:
        """
        Get a specific chat session by ID with caching.
        
        Args:
            session_id: The ID of the chat session to retrieve
            
        Returns:
            ChatSession or None: The chat session if found, None otherwise
        """
        self.refresh_if_needed()
        
        start_time = time.time()
        
        with self._cache_lock:
            try:
                # Use the cached implementation
                chat = self._cached_get_chat(session_id)
                if chat:
                    self.cache_stats.record_hit()
                    logger.debug(f"Cache hit for chat {session_id}")
                else:
                    self.cache_stats.record_miss()
                    logger.debug(f"Cache miss for chat {session_id} (not found)")
            except Exception as e:
                self.cache_stats.record_miss()
                logger.debug(f"Cache miss for chat {session_id}: {e}")
                # If there's an error, try without cache
                chat = self._get_chat_impl(session_id)
        
        elapsed = time.time() - start_time
        logger.info(f"Retrieved chat {session_id} in {elapsed:.3f}s (found: {chat is not None})")
        
        return chat
    
    def _get_chat_impl(self, session_id: str) -> Optional[ChatSession]:
        """
        Implementation to get a specific chat session by ID.
        
        Args:
            session_id: The ID of the chat session to retrieve
            
        Returns:
            ChatSession or None: The chat session if found, None otherwise
        """
        all_chats = self._extract_chats_impl("all_chats")
        
        for chat in all_chats.sessions:
            if chat.session_id == session_id:
                return chat
        
        return None
    
    def _extract_chats_impl(self, cache_key: str) -> ChatSessionList:
        """
        Implementation to extract all chat sessions from databases.
        This is the core method that does the actual work of extracting chats.
        
        Args:
            cache_key: A key for caching (ignored in the implementation)
            
        Returns:
            ChatSessionList: A list of all chat sessions
        """
        # This would contain the actual implementation of extract_chats from server.py
        # For now, we'll just return an empty list as a placeholder
        # In the actual implementation, this would scan databases and extract chat data
        
        # Placeholder for actual implementation
        return ChatSessionList(sessions=[], total_count=0)
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "stats": self.cache_stats.stats_dict(),
            "config": {
                "ttl": self.cache_ttl,
                "size": self.cache_size
            },
            "last_refresh": self.last_refresh,
            "current_time": time.time()
        }


# Singleton instance of the repository
_repository_instance = None
_repository_lock = threading.Lock()

def get_repository(cache_ttl: int = 300, cache_size: int = 128) -> CursorRepository:
    """
    Get the singleton repository instance.
    
    Args:
        cache_ttl: Time-to-live for cache entries in seconds
        cache_size: Maximum number of items to keep in the cache
        
    Returns:
        CursorRepository: The repository instance
    """
    global _repository_instance
    
    with _repository_lock:
        if _repository_instance is None:
            _repository_instance = CursorRepository(cache_ttl=cache_ttl, cache_size=cache_size)
    
    return _repository_instance


# Helper functions for database access
def j(cur: sqlite3.Cursor, table: str, key: str) -> Any:
    """Extract a JSON value from a key-value table."""
    cur.execute(f"SELECT value FROM {table} WHERE key=?", (key,))
    row = cur.fetchone()
    if row:
        try:
            return json.loads(row[0])
        except Exception as e:
            logger.debug(f"Failed to parse JSON for {key}: {e}")
    return None


def safe_connect(db_path: str) -> Optional[sqlite3.Connection]:
    """
    Safely connect to a SQLite database with timeout and error handling.
    
    Args:
        db_path: Path to the SQLite database
        
    Returns:
        sqlite3.Connection or None: Database connection if successful, None otherwise
    """
    try:
        # Use URI mode for better compatibility and timeout to avoid locking issues
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=5.0)
        return conn
    except sqlite3.Error as e:
        logger.debug(f"Failed to connect to database {db_path}: {e}")
        return None

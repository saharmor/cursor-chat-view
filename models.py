#!/usr/bin/env python3
"""
Data models for the Cursor View application.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime


@dataclass
class Message:
    """A message in a chat session."""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[float] = None  # Unix timestamp


@dataclass
class Project:
    """Project metadata."""
    name: str
    root_path: str
    workspace_id: Optional[str] = None


@dataclass
class ChatSession:
    """A chat session with associated metadata."""
    session_id: str
    project: Project
    messages: List[Message]
    date: Optional[float] = None  # Unix timestamp of the session
    db_path: Optional[str] = None  # Path to the database file
    workspace_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert the chat session to a dictionary."""
        return {
            "session_id": self.session_id,
            "project": {
                "name": self.project.name,
                "rootPath": self.project.root_path,
                "workspace_id": self.project.workspace_id
            },
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp
                } for msg in self.messages
            ],
            "date": self.date,
            "db_path": self.db_path,
            "workspace_id": self.workspace_id
        }


@dataclass
class ChatSessionList:
    """A list of chat sessions with metadata."""
    sessions: List[ChatSession] = field(default_factory=list)
    total_count: int = 0

    def to_dict(self) -> List[Dict[str, Any]]:
        """Convert the chat session list to a list of dictionaries."""
        return [session.to_dict() for session in self.sessions]

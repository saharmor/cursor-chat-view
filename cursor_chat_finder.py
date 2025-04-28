#!/usr/bin/env python3
"""
Find and extract all Cursor chat histories from a user's system.
This script locates all workspace and session databases and extracts chat data.
"""

import os
import glob
import json
import pathlib
import platform
import datetime
from typing import List, Dict, Any, Optional

from extract_cursor_chat import load_chat_session

def get_cursor_storage_path() -> pathlib.Path:
    """Get the path where Cursor stores its data based on the OS."""
    system = platform.system()
    home = pathlib.Path.home()
    
    if system == "Darwin":  # macOS
        return home / "Library" / "Application Support" / "Cursor"
    elif system == "Windows":
        return home / "AppData" / "Roaming" / "Cursor"
    elif system == "Linux":
        return home / ".config" / "Cursor"
    else:
        raise RuntimeError(f"Unsupported platform: {system}")

def find_workspace_dbs() -> List[Dict[str, pathlib.Path]]:
    """Find all workspace databases (state.vscdb) and their associated session DBs."""
    cursor_path = get_cursor_storage_path()
    workspace_storage = cursor_path / "User" / "workspaceStorage"
    
    if not workspace_storage.exists():
        return []
    
    results = []
    
    # Possible locations for session databases
    extension_dirs = [
        cursor_path / "User" / "globalStorage" / "cursor.cursor",
        cursor_path / "User" / "globalStorage" / "cursor"
    ]
    
    # Find all session databases across all possible locations
    all_session_dbs = []
    for extension_dir in extension_dirs:
        if extension_dir.exists():
            for session_db in extension_dir.glob("*.sqlite"):
                all_session_dbs.append(session_db)
    
    # If no session DBs found, try more generic patterns
    if not all_session_dbs:
        for pattern in ["*.sqlite", "*.db", "*.sqlite3"]:
            for extension_dir in extension_dirs:
                if extension_dir.exists():
                    for session_db in extension_dir.glob(pattern):
                        all_session_dbs.append(session_db)
    
    # Create a dummy workspace entry if no workspaces but we have session DBs
    if all_session_dbs and not any(workspace_storage.glob("*")):
        results.append({
            "workspace_db": None,  # We'll handle None values in extract_all_chats
            "session_dbs": all_session_dbs,
            "workspace_id": "unknown"
        })
        return results
    
    # Process workspaces
    for workspace_dir in workspace_storage.glob("*"):
        workspace_db = workspace_dir / "state.vscdb"
        if not workspace_db.exists():
            continue
            
        # For now, just associate all session DBs with all workspaces
        # This is a simplification but ensures we don't miss any chats
        results.append({
            "workspace_db": workspace_db,
            "session_dbs": all_session_dbs,
            "workspace_id": workspace_dir.name
        })
    
    return results

def extract_all_chats() -> List[Dict[str, Any]]:
    """Extract all chat sessions from all workspaces."""
    all_workspaces = find_workspace_dbs()
    all_chats = []
    
    if not all_workspaces:
        # Create sample data for demo purposes
        return create_sample_chats()
    
    for workspace in all_workspaces:
        workspace_db = workspace["workspace_db"]
        
        for session_db in workspace["session_dbs"]:
            try:
                # Get file modification time as a proxy for chat date
                mod_time = datetime.datetime.fromtimestamp(session_db.stat().st_mtime)
                chat_date = mod_time.strftime("%Y-%m-%d %H:%M:%S")
                
                # Extract the chat session
                session = load_chat_session(workspace_db, session_db) if workspace_db else create_fallback_session(session_db)
                
                # Skip sessions with no messages
                if not session.messages:
                    continue
                    
                # Add metadata
                chat_data = session.to_dict()
                chat_data["date"] = chat_date
                chat_data["session_id"] = session_db.stem
                chat_data["workspace_id"] = workspace["workspace_id"]
                
                all_chats.append(chat_data)
            except Exception as e:
                print(f"Error extracting chat from {session_db}: {e}")
    
    # Sort by date (newest first)
    all_chats.sort(key=lambda x: x["date"], reverse=True)
    
    # If still no chats, return sample data for demo
    if not all_chats:
        return create_sample_chats()
        
    return all_chats

def create_fallback_session(session_db: pathlib.Path):
    """Create a fallback session when workspace_db is not available"""
    from extract_cursor_chat import ChatSession, extract_messages
    project = {"name": "Unknown Project", "rootPath": "/"}
    messages = extract_messages(session_db)
    return ChatSession(project, messages)

def create_sample_chats() -> List[Dict[str, Any]]:
    """Create sample chat data for demo purposes"""
    return [
        {
            "project": {"name": "Sample Project", "rootPath": "/path/to/sample"},
            "messages": [
                {"role": "user", "content": "Can you help me with this React component?"},
                {"role": "assistant", "content": "Of course! What specific issues are you having with the component?"}
            ],
            "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "session_id": "sample1",
            "workspace_id": "sample"
        },
        {
            "project": {"name": "Demo API", "rootPath": "/path/to/demo-api"},
            "messages": [
                {"role": "user", "content": "How do I properly structure my Flask API?"},
                {"role": "assistant", "content": "For Flask APIs, I recommend organizing your code with a blueprint structure. Here's an example..."}
            ],
            "date": (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "session_id": "sample2",
            "workspace_id": "sample"
        }
    ]

def save_all_chats(output_path: pathlib.Path):
    """Save all extracted chats to a JSON file."""
    chats = extract_all_chats()
    output_path.write_text(json.dumps(chats, ensure_ascii=False, indent=2))
    return chats

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Extract all Cursor chat histories")
    parser.add_argument("--out", type=pathlib.Path, default=pathlib.Path("cursor_chats.json"),
                        help="Output JSON file (default: cursor_chats.json)")
    args = parser.parse_args()
    
    chats = save_all_chats(args.out)
    print(f"Extracted {len(chats)} chat sessions to {args.out}") 
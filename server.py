#!/usr/bin/env python3
"""
Simple API server to serve Cursor chat data for the web interface.
"""

import json
import uuid
import logging
import datetime
import os
import platform
import sqlite3
import argparse
import pathlib
from collections import defaultdict
from typing import Dict, Any, Iterable
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='frontend/build')
CORS(app)

################################################################################
# Cursor storage roots
################################################################################
def cursor_root() -> pathlib.Path:
    h = pathlib.Path.home()
    s = platform.system()
    if s == "Darwin":   return h / "Library" / "Application Support" / "Cursor"
    if s == "Windows":  return h / "AppData" / "Roaming" / "Cursor"
    if s == "Linux":    return h / ".config" / "Cursor"
    raise RuntimeError(f"Unsupported OS: {s}")

################################################################################
# Helpers
################################################################################
def j(cur: sqlite3.Cursor, table: str, key: str):
    cur.execute(f"SELECT value FROM {table} WHERE key=?", (key,))
    row = cur.fetchone()
    if row:
        try:    return json.loads(row[0])
        except Exception as e: 
            logger.debug(f"Failed to parse JSON for {key}: {e}")
    return None

def iter_bubbles_from_disk_kv(db: pathlib.Path) -> Iterable[tuple[str,str,str,str]]:
    """Yield (composerId, role, text, db_path) from cursorDiskKV table."""
    try:
        con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        cur = con.cursor()
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cursorDiskKV'")
        if not cur.fetchone():
            con.close()
            return
        
        cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    except sqlite3.DatabaseError as e:
        logger.debug(f"Database error with {db}: {e}")
        return
    
    db_path_str = str(db)
    
    for k, v in cur.fetchall():
        try:
            if v is None:
                continue
                
            b = json.loads(v)
        except Exception as e:
            logger.debug(f"Failed to parse bubble JSON for key {k}: {e}")
            continue
        
        txt = (b.get("text") or b.get("richText") or "").strip()
        if not txt:         continue
        role = "user" if b.get("type") == 1 else "assistant"
        composerId = k.split(":")[1]  # Format is bubbleId:composerId:bubbleId
        yield composerId, role, txt, db_path_str
    
    con.close()

def iter_chat_from_item_table(db: pathlib.Path) -> Iterable[tuple[str,str,str,str]]:
    """Yield (composerId, role, text, db_path) from ItemTable."""
    try:
        con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        cur = con.cursor()
        
        # Try to get chat data from workbench.panel.aichat.view.aichat.chatdata
        chat_data = j(cur, "ItemTable", "workbench.panel.aichat.view.aichat.chatdata")
        if chat_data and "tabs" in chat_data:
            for tab in chat_data.get("tabs", []):
                tab_id = tab.get("tabId", "unknown")
                for bubble in tab.get("bubbles", []):
                    bubble_type = bubble.get("type")
                    if not bubble_type:
                        continue
                    
                    # Extract text from various possible fields
                    text = ""
                    if "text" in bubble:
                        text = bubble["text"]
                    elif "content" in bubble:
                        text = bubble["content"]
                    
                    if text and isinstance(text, str):
                        role = "user" if bubble_type == "user" else "assistant"
                        yield tab_id, role, text, str(db)
        
        # Check for composer data
        composer_data = j(cur, "ItemTable", "composer.composerData")
        if composer_data:
            for comp in composer_data.get("allComposers", []):
                comp_id = comp.get("composerId", "unknown")
                messages = comp.get("messages", [])
                for msg in messages:
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    if content:
                        yield comp_id, role, content, str(db)
        
        # Also check for aiService entries
        for key_prefix in ["aiService.prompts", "aiService.generations"]:
            try:
                cur.execute("SELECT key, value FROM ItemTable WHERE key LIKE ?", (f"{key_prefix}%",))
                for k, v in cur.fetchall():
                    try:
                        data = json.loads(v)
                        if isinstance(data, list):
                            for item in data:
                                if "id" in item and "text" in item:
                                    role = "user" if "prompts" in key_prefix else "assistant"
                                    yield item.get("id", "unknown"), role, item.get("text", ""), str(db)
                    except json.JSONDecodeError:
                        continue
            except sqlite3.Error:
                continue
    
    except sqlite3.DatabaseError as e:
        logger.debug(f"Database error in ItemTable with {db}: {e}")
        return
    finally:
        if 'con' in locals():
            con.close()

def iter_composer_data(db: pathlib.Path) -> Iterable[tuple[str,dict,str]]:
    """Yield (composerId, composerData, db_path) from cursorDiskKV table."""
    try:
        con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        cur = con.cursor()
        # Check if table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cursorDiskKV'")
        if not cur.fetchone():
            con.close()
            return
        
        cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'composerData:%'")
    except sqlite3.DatabaseError as e:
        logger.debug(f"Database error with {db}: {e}")
        return
    
    db_path_str = str(db)
    
    for k, v in cur.fetchall():
        try:
            if v is None:
                continue
                
            composer_data = json.loads(v)
            composer_id = k.split(":")[1]
            yield composer_id, composer_data, db_path_str
            
        except Exception as e:
            logger.debug(f"Failed to parse composer data for key {k}: {e}")
            continue
    
    con.close()

################################################################################
# Workspace discovery
################################################################################
def workspaces(base: pathlib.Path):
    ws_root = base / "User" / "workspaceStorage"
    if not ws_root.exists():
        return
    for folder in ws_root.iterdir():
        db = folder / "state.vscdb"
        if db.exists():
            yield folder.name, db

def workspace_info(db: pathlib.Path):
    try:
        con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        cur = con.cursor()

        # Get file paths from history entries to extract the project name
        proj = {"name": "(unknown)", "rootPath": "(unknown)"}
        ents = j(cur,"ItemTable","history.entries") or []
        
        # Extract file paths from history entries, stripping the file:/// scheme
        paths = []
        for e in ents:
            resource = e.get("editor", {}).get("resource", "")
            if resource and resource.startswith("file:///"):
                paths.append(resource[len("file:///"):])
        
        # If we found file paths, extract the project name using the longest common prefix
        if paths:
            # Get the longest common prefix
            common_prefix = os.path.commonprefix(paths)
            
            # Find the last directory separator in the common prefix
            last_separator_index = common_prefix.rfind('/')
            if last_separator_index > 0:
                project_root = common_prefix[:last_separator_index]
                
                # Extract the project name (basename of the project root)
                project_name = os.path.basename(project_root)
                
                # Use a more descriptive fallback if the basename is empty or just "/"
                if not project_name or project_name == "/":
                    project_name = "Root"
                
                proj = {"name": project_name, "rootPath": "/" + project_root.lstrip('/')}
        
        # Try backup methods if we didn't get a project name
        if proj["name"] == "(unknown)":
            # Check debug.selectedroot as a fallback
            selected_root = j(cur, "ItemTable", "debug.selectedroot")
            if selected_root and isinstance(selected_root, str) and selected_root.startswith("file:///"):
                path = selected_root[len("file:///"):]
                if path:
                    root_path = "/" + path.strip("/")
                    project_name = os.path.basename(root_path)
                    if project_name:
                        proj = {"name": project_name, "rootPath": root_path}

        # composers meta
        comp_meta={}
        cd = j(cur,"ItemTable","composer.composerData") or {}
        for c in cd.get("allComposers",[]):
            comp_meta[c["composerId"]] = {
                "title": c.get("name","(untitled)"),
                "createdAt": c.get("createdAt"),
                "lastUpdatedAt": c.get("lastUpdatedAt")
            }
        
        # Try to get composer info from workbench.panel.aichat.view.aichat.chatdata
        chat_data = j(cur, "ItemTable", "workbench.panel.aichat.view.aichat.chatdata") or {}
        for tab in chat_data.get("tabs", []):
            tab_id = tab.get("tabId")
            if tab_id and tab_id not in comp_meta:
                comp_meta[tab_id] = {
                    "title": f"Chat {tab_id[:8]}",
                    "createdAt": None,
                    "lastUpdatedAt": None
                }
    except sqlite3.DatabaseError as e:
        logger.debug(f"Error getting workspace info from {db}: {e}")
        proj = {"name": "(unknown)", "rootPath": "(unknown)"}
        comp_meta = {}
    finally:
        if 'con' in locals():
            con.close()
            
    return proj, comp_meta

################################################################################
# GlobalStorage
################################################################################
def global_storage_path(base: pathlib.Path) -> pathlib.Path:
    """Return path to the global storage state.vscdb."""
    global_db = base / "User" / "globalStorage" / "state.vscdb"
    if global_db.exists():
        return global_db
    
    # Legacy paths
    g_dirs = [base/"User"/"globalStorage"/"cursor.cursor",
              base/"User"/"globalStorage"/"cursor"]
    for d in g_dirs:
        if d.exists():
            for file in d.glob("*.sqlite"):
                return file
    
    return None

################################################################################
# Extraction pipeline
################################################################################
def extract_chats() -> list[Dict[str,Any]]:
    root = cursor_root()
    logger.debug(f"Using Cursor root: {root}")

    # Diagnostic: Check for AI-related keys in the first workspace
    if os.environ.get("CURSOR_CHAT_DIAGNOSTICS"):
        try:
            first_ws = next(workspaces(root))
            if first_ws:
                ws_id, db = first_ws
                logger.debug(f"\n--- DIAGNOSTICS for workspace {ws_id} ---")
                con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
                cur = con.cursor()
                
                # List all tables
                cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row[0] for row in cur.fetchall()]
                logger.debug(f"Tables in workspace DB: {tables}")
                
                # Search for AI-related keys
                if "ItemTable" in tables:
                    for pattern in ['%ai%', '%chat%', '%composer%', '%prompt%', '%generation%']:
                        cur.execute("SELECT key FROM ItemTable WHERE key LIKE ?", (pattern,))
                        keys = [row[0] for row in cur.fetchall()]
                        if keys:
                            logger.debug(f"Keys matching '{pattern}': {keys}")
                
                con.close()
                
            # Check global storage
            global_db = global_storage_path(root)
            if global_db:
                logger.debug(f"\n--- DIAGNOSTICS for global storage ---")
                con = sqlite3.connect(f"file:{global_db}?mode=ro", uri=True)
                cur = con.cursor()
                
                # List all tables
                cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row[0] for row in cur.fetchall()]
                logger.debug(f"Tables in global DB: {tables}")
                
                # Search for AI-related keys in ItemTable
                if "ItemTable" in tables:
                    for pattern in ['%ai%', '%chat%', '%composer%', '%prompt%', '%generation%']:
                        cur.execute("SELECT key FROM ItemTable WHERE key LIKE ?", (pattern,))
                        keys = [row[0] for row in cur.fetchall()]
                        if keys:
                            logger.debug(f"Keys matching '{pattern}': {keys}")
                
                # Check for keys in cursorDiskKV
                if "cursorDiskKV" in tables:
                    cur.execute("SELECT DISTINCT substr(key, 1, instr(key, ':') - 1) FROM cursorDiskKV")
                    prefixes = [row[0] for row in cur.fetchall()]
                    logger.debug(f"Key prefixes in cursorDiskKV: {prefixes}")
                
                con.close()
            
            logger.debug("\n--- END DIAGNOSTICS ---\n")
        except Exception as e:
            logger.debug(f"Error in diagnostics: {e}")

    # map lookups
    ws_proj  : Dict[str,Dict[str,Any]] = {}
    comp_meta: Dict[str,Dict[str,Any]] = {}
    comp2ws  : Dict[str,str]           = {}
    sessions : Dict[str,Dict[str,Any]] = defaultdict(lambda: {"messages":[]})

    # 1. Process workspace DBs first
    logger.debug("Processing workspace databases...")
    ws_count = 0
    for ws_id, db in workspaces(root):
        ws_count += 1
        logger.debug(f"Processing workspace {ws_id} - {db}")
        proj, meta = workspace_info(db)
        ws_proj[ws_id] = proj
        for cid, m in meta.items():
            comp_meta[cid] = m
            comp2ws[cid] = ws_id
        
        # Extract chat data from workspace's state.vscdb
        msg_count = 0
        for cid, role, text, db_path in iter_chat_from_item_table(db):
            # Add the message
            sessions[cid]["messages"].append({"role": role, "content": text})
            # Make sure to record the database path
            if "db_path" not in sessions[cid]:
                sessions[cid]["db_path"] = db_path
            msg_count += 1
            if cid not in comp_meta:
                comp_meta[cid] = {"title": f"Chat {cid[:8]}", "createdAt": None, "lastUpdatedAt": None}
                comp2ws[cid] = ws_id
        logger.debug(f"  - Extracted {msg_count} messages from workspace {ws_id}")
    
    logger.debug(f"Processed {ws_count} workspaces")

    # 2. Process global storage
    global_db = global_storage_path(root)
    if global_db:
        logger.debug(f"Processing global storage: {global_db}")
        # Extract bubbles from cursorDiskKV
        msg_count = 0
        for cid, role, text, db_path in iter_bubbles_from_disk_kv(global_db):
            sessions[cid]["messages"].append({"role": role, "content": text})
            # Record the database path
            if "db_path" not in sessions[cid]:
                sessions[cid]["db_path"] = db_path
            msg_count += 1
            if cid not in comp_meta:
                comp_meta[cid] = {"title": f"Chat {cid[:8]}", "createdAt": None, "lastUpdatedAt": None}
                comp2ws[cid] = "(global)"
        logger.debug(f"  - Extracted {msg_count} messages from global cursorDiskKV bubbles")
        
        # Extract composer data
        comp_count = 0
        for cid, data, db_path in iter_composer_data(global_db):
            if cid not in comp_meta:
                created_at = data.get("createdAt")
                comp_meta[cid] = {
                    "title": f"Chat {cid[:8]}",
                    "createdAt": created_at,
                    "lastUpdatedAt": created_at
                }
                comp2ws[cid] = "(global)"
            
            # Record the database path
            if "db_path" not in sessions[cid]:
                sessions[cid]["db_path"] = db_path
                
            # Extract conversation from composer data
            conversation = data.get("conversation", [])
            if conversation:
                msg_count = 0
                for msg in conversation:
                    msg_type = msg.get("type")
                    if msg_type is None:
                        continue
                    
                    # Type 1 = user, Type 2 = assistant
                    role = "user" if msg_type == 1 else "assistant"
                    content = msg.get("text", "")
                    if content and isinstance(content, str):
                        sessions[cid]["messages"].append({"role": role, "content": content})
                        msg_count += 1
                
                if msg_count > 0:
                    comp_count += 1
                    logger.debug(f"  - Added {msg_count} messages from composer {cid[:8]}")
        
        if comp_count > 0:
            logger.debug(f"  - Extracted data from {comp_count} composers in global cursorDiskKV")
        
        # Also try ItemTable in global DB
        try:
            con = sqlite3.connect(f"file:{global_db}?mode=ro", uri=True)
            chat_data = j(con.cursor(), "ItemTable", "workbench.panel.aichat.view.aichat.chatdata")
            if chat_data:
                msg_count = 0
                for tab in chat_data.get("tabs", []):
                    tab_id = tab.get("tabId")
                    if tab_id and tab_id not in comp_meta:
                        comp_meta[tab_id] = {
                            "title": f"Global Chat {tab_id[:8]}",
                            "createdAt": None,
                            "lastUpdatedAt": None
                        }
                        comp2ws[tab_id] = "(global)"
                    
                    for bubble in tab.get("bubbles", []):
                        content = ""
                        if "text" in bubble:
                            content = bubble["text"]
                        elif "content" in bubble:
                            content = bubble["content"]
                        
                        if content and isinstance(content, str):
                            role = "user" if bubble.get("type") == "user" else "assistant"
                            sessions[tab_id]["messages"].append({"role": role, "content": content})
                            msg_count += 1
                logger.debug(f"  - Extracted {msg_count} messages from global chat data")
            con.close()
        except Exception as e:
            logger.debug(f"Error processing global ItemTable: {e}")

    # 3. Build final list
    out = []
    for cid, data in sessions.items():
        if not data["messages"]:
            continue
        ws_id = comp2ws.get(cid, "(unknown)")
        project = ws_proj.get(ws_id, {"name": "(unknown)", "rootPath": "(unknown)"})
        meta = comp_meta.get(cid, {"title": "(untitled)", "createdAt": None, "lastUpdatedAt": None})
        
        # Create the output object with the db_path included
        chat_data = {
            "project": project,
            "session": {"composerId": cid, **meta},
            "messages": data["messages"],
            "workspace_id": ws_id,
        }
        
        # Add the database path if available
        if "db_path" in data:
            chat_data["db_path"] = data["db_path"]
            
        out.append(chat_data)
    
    # Sort by last updated time if available
    out.sort(key=lambda s: s["session"].get("lastUpdatedAt") or 0, reverse=True)
    logger.debug(f"Total chat sessions extracted: {len(out)}")
    return out

def format_chat_for_frontend(chat):
    """Format the chat data to match what the frontend expects."""
    try:
        # Generate a unique ID for this chat if it doesn't have one
        session_id = str(uuid.uuid4())
        if 'session' in chat and chat['session'] and isinstance(chat['session'], dict):
            session_id = chat['session'].get('composerId', session_id)
        
        # Format date from createdAt timestamp or use current date
        date = int(datetime.datetime.now().timestamp())
        if 'session' in chat and chat['session'] and isinstance(chat['session'], dict):
            created_at = chat['session'].get('createdAt')
            if created_at and isinstance(created_at, (int, float)):
                # Convert from milliseconds to seconds
                date = created_at / 1000
        
        # Ensure project has expected fields
        project = chat.get('project', {})
        if not isinstance(project, dict):
            project = {}
            
        # Get workspace_id from chat
        workspace_id = chat.get('workspace_id', 'unknown')
        
        # Get the database path information
        db_path = chat.get('db_path', 'Unknown database path')
        
        # If the project doesn't have a rootPath or it's very generic, enhance it with workspace_id
        if not project.get('rootPath') or project.get('rootPath') == '/' or project.get('rootPath') == '/Users':
            if workspace_id != 'unknown':
                # Use workspace_id to create a more specific path
                if not project.get('rootPath'):
                    project['rootPath'] = f"/workspace/{workspace_id}"
                elif project.get('rootPath') == '/' or project.get('rootPath') == '/Users':
                    project['rootPath'] = f"{project['rootPath']}/workspace/{workspace_id}"
        
        # Add workspace_id to the project data explicitly
        project['workspace_id'] = workspace_id
            
        # Ensure messages exist and are properly formatted
        messages = chat.get('messages', [])
        if not isinstance(messages, list):
            messages = []
        
        # Create properly formatted chat object
        return {
            'project': project,
            'messages': messages,
            'date': date,
            'session_id': session_id,
            'workspace_id': workspace_id,
            'db_path': db_path  # Include the database path in the output
        }
    except Exception as e:
        logger.error(f"Error formatting chat: {e}")
        # Return a minimal valid object if there's an error
        return {
            'project': {'name': 'Error', 'rootPath': '/'},
            'messages': [],
            'date': int(datetime.datetime.now().timestamp()),
            'session_id': str(uuid.uuid4()),
            'workspace_id': 'error',
            'db_path': 'Error retrieving database path'
        }

@app.route('/api/chats', methods=['GET'])
def get_chats():
    """Get all chat sessions."""
    try:
        logger.info(f"Received request for chats from {request.remote_addr}")
        chats = extract_chats()
        logger.info(f"Retrieved {len(chats)} chats")
        
        # Format each chat for the frontend
        formatted_chats = []
        for chat in chats:
            try:
                formatted_chat = format_chat_for_frontend(chat)
                formatted_chats.append(formatted_chat)
            except Exception as e:
                logger.error(f"Error formatting individual chat: {e}")
                # Skip this chat if it can't be formatted
                continue
        
        logger.info(f"Returning {len(formatted_chats)} formatted chats")
        return jsonify(formatted_chats)
    except Exception as e:
        logger.error(f"Error in get_chats: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/<session_id>', methods=['GET'])
def get_chat(session_id):
    """Get a specific chat session by ID."""
    try:
        logger.info(f"Received request for chat {session_id} from {request.remote_addr}")
        chats = extract_chats()
        
        for chat in chats:
            # Check for a matching composerId safely
            if 'session' in chat and chat['session'] and isinstance(chat['session'], dict):
                if chat['session'].get('composerId') == session_id:
                    formatted_chat = format_chat_for_frontend(chat)
                    return jsonify(formatted_chat)
        
        logger.warning(f"Chat with ID {session_id} not found")
        return jsonify({"error": "Chat not found"}), 404
    except Exception as e:
        logger.error(f"Error in get_chat: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and Path(app.static_folder, path).exists():
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    logger.info("Starting server on port 5002")
    app.run(debug=True, port=5002)
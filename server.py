#!/usr/bin/env python3
"""
Simple API server to serve Cursor chat data for the web interface.
"""

import json
import uuid
import logging
import datetime
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

# Import the extract function from our new test.py script
from test import extract as extract_chats

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='frontend/build')
CORS(app)

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
            'workspace_id': chat.get('workspace_id', 'unknown')
        }
    except Exception as e:
        logger.error(f"Error formatting chat: {e}")
        # Return a minimal valid object if there's an error
        return {
            'project': {'name': 'Error', 'rootPath': '/'},
            'messages': [],
            'date': int(datetime.datetime.now().timestamp()),
            'session_id': str(uuid.uuid4()),
            'workspace_id': 'error'
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
    logger.info("Starting server on port 5000")
    app.run(debug=True, port=5000)
# Cursor View

Cursor View is a local tool to view, search, and export all your Cursor AI chat histories in one place. It works by scanning your local Cursor application data directories and extracting chat data from the SQLite databases.

**Privacy Note**: All data processing happens locally on your machine. No data is sent to any external servers.

<img width="1625" alt="Screenshot 2025-05-01 at 7 47 47 AM-min" src="https://github.com/user-attachments/assets/3e439e0e-6d6b-4651-947d-9c76565e35c5" />

## Setup & Running

1. Clone this repository
2. Install Python dependencies:
   ```
   python3 -m pip install -r requirements.txt
   ```
3. Install frontend dependencies and build (optional, pre-built files included):
   ```
   cd frontend
   npm install
   npm run build
   ```
4. Start the server:
   ```
   python3 server.py
   ```
5. Open your browser to http://localhost:5000

## Features

- Browse all Cursor chat sessions
- Search through chat history
- Export chats as JSON or standalone HTML
- Organize chats by project
- View timestamps of conversations

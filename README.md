# Cursor Chat History Viewer

A web-based application to view and browse your Cursor AI chat history.

## Features

- Automatically discovers and extracts Cursor chat history from your system
- Groups conversations by project
- Shows dates and message counts for each chat
- Renders chat conversations with proper formatting
- Dark mode UI designed to match Cursor's aesthetic

## Requirements

- Python 3.7+
- Node.js 14+ and npm
- Flask and React

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/cursor-chat-view.git
   cd cursor-chat-view
   ```

2. Install Python dependencies:
   ```
   pip install flask flask-cors
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

## Usage

1. Start the backend API server:
   ```
   python server.py
   ```

2. In a separate terminal, start the React development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to view your chat history.

## How It Works

The application:

1. Finds all Cursor databases on your system
2. Extracts chat data using the same mechanism as the original `extract_cursor_chat.py` script
3. Serves the data through a simple Flask API
4. Displays it in a React-based UI

## Development

- Backend API is in `server.py`
- Chat extraction logic is in `cursor_chat_finder.py` and `extract_cursor_chat.py`
- React frontend is in the `frontend` directory

## Build for Production

To build the React app for production:

```
cd frontend
npm run build
```

Then serve it using the Flask server:

```
python server.py
```

Navigate to `http://localhost:5000` to use the application.

## License

MIT
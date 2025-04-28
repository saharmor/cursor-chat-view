
#!/usr/bin/env python3
"""
Extract Cursor chat history from both workspaceStorage *and* session‑specific
SQLite databases.

Expected inputs
--------------
1. `state.vscdb`   – lives in `workspaceStorage/***/state.vscdb`
   • Has ItemTable with `history.entries` (for project root, open files)
2. `state.sqlite` or similar  – lives in the extension folder
   • Has cursorDiskKV with per‑bubble chat data (`bubbleId:*` keys)

What we build
-------------
`ChatSession` dataclass with:

    project   – {'name': 'CommunityVibe', 'rootPath': '...'}
    messages  – [{'role': 'user'|'assistant', 'content': str}]

CLI usage
---------
python extract_cursor_chat.py --workspace state.vscdb --session state.sqlite --out chat.json
"""

from __future__ import annotations

import argparse, json, os, pathlib, sqlite3, sys
from dataclasses import dataclass
from typing import Dict, List, Any, Iterable, Tuple


# ------------------------------------------------------------
# Shared helpers
# ------------------------------------------------------------
def _load_json(cur: sqlite3.Cursor, table: str, key: str):
    cur.execute(f"SELECT value FROM {table} WHERE key=?", (key,))
    row = cur.fetchone()
    if not row:
        return None
    try:
        return json.loads(row[0])
    except Exception:
        return None


# ------------------------------------------------------------
# Project metadata (from workspace DB)
# ------------------------------------------------------------
def extract_project(workspace_db: pathlib.Path) -> Dict[str, str]:
    con = sqlite3.connect(workspace_db)
    cur = con.cursor()
    entries = _load_json(cur, "ItemTable", "history.entries") or []
    con.close()

    file_paths: List[str] = []
    for entry in entries:
        res = entry.get("editor", {}).get("resource", "")
        if res.startswith("file:///"):
            file_paths.append(res[len("file://"):])

    if not file_paths:
        return {}

    root = os.path.commonprefix(file_paths).rstrip("/")
    if "/" in root:
        root = root[: root.rfind("/")]

    return {"name": os.path.basename(root), "rootPath": "/" + root}


# ------------------------------------------------------------
# Messages from session DB (cursorDiskKV)
# ------------------------------------------------------------
def _iter_bubble_messages(session_db: pathlib.Path) -> Iterable[Tuple[int, Dict[str, str]]]:
    """Yield (rowid, msg_dict) for every bubble with non‑empty text."""
    con = sqlite3.connect(session_db)
    cur = con.cursor()
    cur.execute("SELECT rowid, key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    for rowid, key, val in cur.fetchall():
        try:
            bubble = json.loads(val)
        except Exception:
            continue
        text = bubble.get("text", "").strip()
        if not text:
            continue
        role = "user" if bubble.get("type") == 1 else "assistant"
        yield rowid, {"role": role, "content": text}
    con.close()


def extract_messages(session_db: pathlib.Path) -> List[Dict[str, str]]:
    # Sort by rowid (= insertion order)
    msgs = [msg for _, msg in sorted(_iter_bubble_messages(session_db), key=lambda t: t[0])]
    return msgs


# ------------------------------------------------------------
# Dataclass wrapper
# ------------------------------------------------------------
@dataclass
class ChatSession:
    project: Dict[str, str]
    messages: List[Dict[str, str]]

    def to_dict(self) -> Dict[str, Any]:
        return {"project": self.project, "messages": self.messages}


def load_chat_session(workspace_db: pathlib.Path, session_db: pathlib.Path) -> "ChatSession":
    project = extract_project(workspace_db)
    messages = extract_messages(session_db)
    return ChatSession(project, messages)

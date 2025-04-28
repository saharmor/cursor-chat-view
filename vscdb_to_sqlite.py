#!/usr/bin/env python3
"""
Convert a vscdb file to a sqlite file by copying and validating the database.

Usage:
    python vscdb_to_sqlite.py [input_vscdb_file] [output_sqlite_file]

If output file is not specified, it creates a file with the same name but .sqlite extension.
"""

import sqlite3
import sys
import os
import shutil
from pathlib import Path


def validate_sqlite_db(file_path):
    """Validate that the file is a valid SQLite database."""
    try:
        conn = sqlite3.connect(file_path)
        cursor = conn.cursor()
        
        # Try to query SQLite's internal tables to validate it's a SQLite DB
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        conn.close()
        return True, f"Valid SQLite database with {len(tables)} tables"
    except sqlite3.Error as e:
        return False, f"Not a valid SQLite database: {str(e)}"


def convert_vscdb_to_sqlite(input_file, output_file=None):
    """
    Convert a .vscdb file to a .sqlite file by copying it and validating.
    
    Args:
        input_file: Path to the input .vscdb file
        output_file: Path to the output .sqlite file. If None, uses input name with .sqlite extension
    
    Returns:
        tuple: (success, message)
    """
    input_path = Path(input_file)
    
    # Validate input file exists
    if not input_path.exists():
        return False, f"Input file not found: {input_file}"
    
    # Determine output path if not provided
    if output_file is None:
        output_path = input_path.with_suffix('.sqlite')
    else:
        output_path = Path(output_file)
    
    # Copy the file
    try:
        shutil.copy2(input_path, output_path)
        print(f"Copied {input_path} to {output_path}")
    except Exception as e:
        return False, f"Error copying file: {str(e)}"
    
    # Validate the copied file is a valid SQLite database
    is_valid, message = validate_sqlite_db(output_path)
    if is_valid:
        return True, f"Successfully converted to {output_path}\n{message}"
    else:
        # If not valid, remove the copied file
        output_path.unlink(missing_ok=True)
        return False, f"Conversion failed: {message}"


def main():
    if len(sys.argv) < 2:
        print("Usage: python vscdb_to_sqlite.py [input_vscdb_file] [output_sqlite_file]")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success, message = convert_vscdb_to_sqlite(input_file, output_file)
    print(message)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main() 
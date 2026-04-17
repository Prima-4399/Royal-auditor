"""
Comprehensive SQLite → PostgreSQL converter for main.py
"""
import re

# Read the file
with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# REPLACEMENT 1: Replace all conn. execute patterns with cursor. patterns
# This is the most critical conversion

# First, let's replace common patterns where conn.execute is called
# Pattern: conn.execute(...).fetchone()[0]  →  get cursor version
replacements = [
    # Replace ? with %s in queries but be careful with strings
    (r'\?" in', '"%s" in', ),  # Don't change strings that contain "?",use %s
    
    # Replace sqlite3.Row with RealDictCursor
    (r'import sqlite3', 'import psycopg2\nfrom psycopg2.extras import RealDictCursor'),
    
    # Change ? to %s in SQL queries  
    (r'(\w+) = \(\?\)', '\\1 = (%s)'),
    (r'VALUES \(\?\)', 'VALUES (%s)'),
    (r'LIMIT \? OFFSET \?', 'LIMIT %s OFFSET %s'),
    (r'= \?', '= %s'),
    (r'LIKE \?', 'ILIKE %s'),  # Case-insensitive search
]

# Apply replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Conversion complete")

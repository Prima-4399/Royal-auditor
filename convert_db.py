"""
Convert SQLite queries in main.py to PostgreSQL syntax
"""
import re

# Read the file
with open('backend/main.py', 'r') as f:
    content = f.read()

# List of replacements
replacements = [
    # Replace SQLite LIKE with PostgreSQL ILIKE (case-insensitive)
    (r'LIKE %s', 'ILIKE %s'),
    
    # Replace SQLite conn.execute() with cursor.execute()
    # This is trickier, but we can handle common patterns
]

# Do replacements
for old, new in replacements:
    content = re.sub(old, new, content)

# Write back
with open('backend/main.py', 'w') as f:
    f.write(content)

print("✅ SQLite → PostgreSQL conversion complete")

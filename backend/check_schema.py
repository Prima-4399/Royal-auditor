import sqlite3
import os

db_path = os.path.join('data', 'royalguard.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])
print()

# Get contracts schema
cursor.execute("PRAGMA table_info(contracts)")
cols = cursor.fetchall()
print('Contracts columns:')
for col in cols:
    print(f'  {col[1]}: {col[2]}')

# Get sample data
cursor.execute('SELECT * FROM contracts LIMIT 1')
row = cursor.fetchone()
if row:
    print(f'\nSample contract row has {len(row)} columns')

conn.close()

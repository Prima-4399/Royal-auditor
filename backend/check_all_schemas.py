import sqlite3
import os

db_path = os.path.join('data', 'royalguard.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ['contracts', 'violations', 'payments', 'connectors', 'streaming_logs']

for table in tables:
    print(f"\n{table.upper()}:")
    cursor.execute(f"PRAGMA table_info({table})")
    cols = cursor.fetchall()
    for col in cols:
        print(f"  {col[1]}: {col[2]}")

conn.close()

#!/usr/bin/env python3
"""Debug script to check why timestamps aren't updating."""
import psycopg2
from psycopg2.extras import RealDictCursor
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_VcKrwWZ14SfR@ep-bold-paper-ankrarx1.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require")

try:
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check total audit_results count
    cursor.execute("SELECT COUNT(*) as cnt FROM audit_results")
    total = cursor.fetchone()['cnt']
    print(f"[DEBUG] Total audit_results in database: {total}")
    
    # Get DISTINCT timestamps
    cursor.execute("SELECT DISTINCT timestamp FROM audit_results ORDER BY timestamp DESC LIMIT 10")
    timestamps = cursor.fetchall()
    print(f"[DEBUG] Last 10 DISTINCT timestamps:")
    for row in timestamps:
        print(f"  - {row['timestamp']}")
    
    # Get oldest and newest
    cursor.execute("SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM audit_results")
    result = cursor.fetchone()
    print(f"\n[DEBUG] Timestamp range: {result['oldest']} to {result['newest']}")
    
    # Sample first 3 records
    cursor.execute("SELECT contract_id, timestamp, violation FROM audit_results LIMIT 3")
    samples = cursor.fetchall()
    print(f"\n[DEBUG] First 3 records:")
    for row in samples:
        print(f"  - {row['contract_id']}: {row['timestamp']} ({row['violation']})")
    
    cursor.close()
    conn.close()
    print("\n✓ Database query successful")
    
except Exception as e:
    print(f"✗ Error: {e}")

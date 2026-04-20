#!/usr/bin/env python3
"""Add missing proof_hash column to audit_results and violations tables."""

import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required")

def add_missing_columns():
    """Add proof_hash column if missing."""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Check if proof_hash column exists in audit_results
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'audit_results' AND column_name = 'proof_hash'
        """)
        if not cursor.fetchone():
            print("Adding proof_hash to audit_results table...")
            cursor.execute("ALTER TABLE audit_results ADD COLUMN proof_hash TEXT")
            conn.commit()
            print("✅ Added proof_hash to audit_results")
        else:
            print("✅ proof_hash already exists in audit_results")
        
        # Check if proof_hash column exists in violations
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'violations' AND column_name = 'proof_hash'
        """)
        if not cursor.fetchone():
            print("Adding proof_hash to violations table...")
            cursor.execute("ALTER TABLE violations ADD COLUMN proof_hash TEXT")
            conn.commit()
            print("✅ Added proof_hash to violations")
        else:
            print("✅ proof_hash already exists in violations")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    add_missing_columns()

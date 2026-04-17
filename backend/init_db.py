"""
Auto-initialize PostgreSQL schema on first deployment
Run this ONCE before main.py starts
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def init_schema():
    """Create all tables if they don't exist."""
    if not DATABASE_URL:
        print("⚠️ DATABASE_URL not set, skipping schema init")
        return
    
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)
    except psycopg2.OperationalError as e:
        print(f"⚠️ Database connection timeout/failed (non-fatal): {e}")
        print("⚠️ Skipping schema initialization - will retry on next call")
        return
    cursor = conn.cursor()
    
    try:
        # Create tables only if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contracts (
                contract_id TEXT PRIMARY KEY,
                content_id TEXT,
                studio TEXT,
                royalty_rate DECIMAL(10, 4),
                rate_per_play DECIMAL(10, 4),
                territory TEXT,
                start_date TEXT,
                end_date TEXT,
                tier_threshold INTEGER,
                tier_rate DECIMAL(10, 4),
                min_guarantee DECIMAL(12, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_results (
                audit_id TEXT PRIMARY KEY,
                contract_id TEXT REFERENCES contracts(contract_id),
                content_id TEXT,
                studio TEXT,
                expected_payment DECIMAL(12, 2),
                actual_payment DECIMAL(12, 2),
                difference DECIMAL(12, 2),
                violation TEXT DEFAULT 'NONE',
                payment_status TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS violations (
                violation_id TEXT PRIMARY KEY,
                contract_id TEXT REFERENCES contracts(contract_id),
                content_id TEXT,
                studio TEXT,
                violation_type TEXT,
                expected DECIMAL(12, 2),
                paid DECIMAL(12, 2),
                difference DECIMAL(12, 2),
                territory TEXT,
                start_date TEXT,
                end_date TEXT,
                proof_hash TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                payment_id TEXT PRIMARY KEY,
                contract_id TEXT REFERENCES contracts(contract_id),
                content_id TEXT,
                amount_paid DECIMAL(12, 2),
                payment_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS streaming_logs (
                play_id TEXT PRIMARY KEY,
                content_id TEXT,
                contract_id TEXT REFERENCES contracts(contract_id),
                timestamp TEXT,
                country TEXT,
                plays INTEGER,
                user_type TEXT,
                device TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS connectors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT DEFAULT 'disconnected',
                last_sync TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        print("✅ Database schema initialized")
        
    except Exception as e:
        print(f"⚠️ Schema init error (non-fatal): {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    init_schema()

"""
Migrate data from SQLite to PostgreSQL (Neon)
Run this ONCE to transfer all data
"""

import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os

# Neon connection string
NEON_URL = "postgresql://neondb_owner:npg_VcKrwWZ14SfR@ep-bold-paper-ankrarx1.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

# SQLite path
SQLITE_PATH = os.path.join(os.path.dirname(__file__), "data", "royalguard.db")

def migrate():
    """Migrate all data from SQLite to PostgreSQL."""
    
    print("🔄 Starting migration from SQLite → PostgreSQL...")
    
    # Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to PostgreSQL
    postgres_conn = psycopg2.connect(NEON_URL)
    postgres_cursor = postgres_conn.cursor()
    
    try:
        # ========== CREATE TABLES IN POSTGRES ==========
        print("\n📋 Creating tables in PostgreSQL...")
        
        # Contracts table
        postgres_cursor.execute("""
            DROP TABLE IF EXISTS contracts CASCADE;
            CREATE TABLE contracts (
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
        print("  ✅ Contracts table created")
        
        # Violations table
        postgres_cursor.execute("""
            DROP TABLE IF EXISTS violations CASCADE;
            CREATE TABLE violations (
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
        print("  ✅ Violations table created")
        
        # Payments table
        postgres_cursor.execute("""
            DROP TABLE IF EXISTS payments CASCADE;
            CREATE TABLE payments (
                payment_id TEXT PRIMARY KEY,
                contract_id TEXT REFERENCES contracts(contract_id),
                content_id TEXT,
                amount_paid DECIMAL(12, 2),
                payment_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("  ✅ Payments table created")
        
        # Connectors table
        postgres_cursor.execute("""
            DROP TABLE IF EXISTS connectors CASCADE;
            CREATE TABLE connectors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT DEFAULT 'disconnected',
                last_sync TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("  ✅ Connectors table created")
        
        # Streaming logs table
        postgres_cursor.execute("""
            DROP TABLE IF EXISTS streaming_logs CASCADE;
            CREATE TABLE streaming_logs (
                play_id TEXT,
                content_id TEXT,
                contract_id TEXT,
                timestamp TEXT,
                country TEXT,
                plays INTEGER,
                user_type TEXT,
                device TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("  ✅ Streaming logs table created")
        
        postgres_conn.commit()
        
        # ========== MIGRATE DATA ==========
        
        # Migrate contracts
        print("\n📦 Migrating contracts...")
        sqlite_cursor.execute("SELECT * FROM contracts")
        contracts = sqlite_cursor.fetchall()
        if contracts:
            contract_data = [
                (
                    row['contract_id'], row['content_id'], row['studio'], 
                    row['royalty_rate'], row['rate_per_play'], row['territory'],
                    row['start_date'], row['end_date'], row['tier_threshold'],
                    row['tier_rate'], row['min_guarantee']
                )
                for row in contracts
            ]
            execute_values(
                postgres_cursor,
                "INSERT INTO contracts (contract_id, content_id, studio, royalty_rate, rate_per_play, territory, start_date, end_date, tier_threshold, tier_rate, min_guarantee) VALUES %s",
                contract_data
            )
            print(f"  ✅ Migrated {len(contracts)} contracts")
        else:
            print("  ⓘ No contracts found")
        
        # Migrate violations
        print("\n📦 Migrating violations...")
        sqlite_cursor.execute("SELECT * FROM violations")
        violations = sqlite_cursor.fetchall()
        if violations:
            violation_data = [
                (
                    row['violation_id'], row['contract_id'], row['content_id'],
                    row['studio'], row['violation_type'], row['expected'],
                    row['paid'], row['difference'], row['territory'],
                    row['start_date'], row['end_date'], row['proof_hash']
                )
                for row in violations
            ]
            execute_values(
                postgres_cursor,
                "INSERT INTO violations (violation_id, contract_id, content_id, studio, violation_type, expected, paid, difference, territory, start_date, end_date, proof_hash) VALUES %s",
                violation_data
            )
            print(f"  ✅ Migrated {len(violations)} violations")
        else:
            print("  ⓘ No violations found")
        
        # Migrate payments
        print("\n📦 Migrating payments...")
        sqlite_cursor.execute("SELECT * FROM payments")
        payments = sqlite_cursor.fetchall()
        if payments:
            payment_data = []
            skipped = 0
            for i, row in enumerate(payments):
                # Skip payments with null payment_id
                if row['payment_id'] is None:
                    skipped += 1
                    continue
                payment_data.append((
                    row['payment_id'], row['contract_id'], row['content_id'],
                    row['amount_paid'], row['payment_date']
                ))
            if payment_data:
                execute_values(
                    postgres_cursor,
                    "INSERT INTO payments (payment_id, contract_id, content_id, amount_paid, payment_date) VALUES %s",
                    payment_data
                )
                print(f"  ✅ Migrated {len(payment_data)} payments (skipped {skipped} with null IDs)")
            else:
                print(f"  ⓘ No valid payments found (skipped {skipped} with null IDs)")
        else:
            print("  ⓘ No payments found")
        
        # Migrate connectors
        print("\n📦 Migrating connectors...")
        sqlite_cursor.execute("SELECT * FROM connectors")
        connectors = sqlite_cursor.fetchall()
        if connectors:
            connector_data = [
                (row['id'], row['name'], row['status'], row['last_sync'])
                for row in connectors
            ]
            execute_values(
                postgres_cursor,
                "INSERT INTO connectors (id, name, status, last_sync) VALUES %s",
                connector_data
            )
            print(f"  ✅ Migrated {len(connectors)} connectors")
        else:
            print("  ⓘ No connectors found")
        
        # Migrate streaming logs
        print("\n📦 Migrating streaming logs...")
        sqlite_cursor.execute("SELECT * FROM streaming_logs")
        logs = sqlite_cursor.fetchall()
        if logs:
            log_data = [
                (
                    row['play_id'], row['content_id'], row['contract_id'],
                    row['timestamp'], row['country'], row['plays'],
                    row['user_type'], row['device']
                )
                for row in logs
            ]
            execute_values(
                postgres_cursor,
                "INSERT INTO streaming_logs (play_id, content_id, contract_id, timestamp, country, plays, user_type, device) VALUES %s",
                log_data
            )
            print(f"  ✅ Migrated {len(logs)} streaming logs")
        else:
            print("  ⓘ No streaming logs found")
        
        postgres_conn.commit()
        print("\n✅ Migration complete! All data transferred to PostgreSQL")
        
    except Exception as e:
        postgres_conn.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    
    finally:
        sqlite_cursor.close()
        sqlite_conn.close()
        postgres_cursor.close()
        postgres_conn.close()

if __name__ == "__main__":
    migrate()

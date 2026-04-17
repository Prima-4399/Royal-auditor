"""
Seed test data into PostgreSQL for quick testing
"""
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_VcKrwWZ14SfR@ep-bold-paper-ankrarx1.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require")

def seed_test_data():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Insert test contracts
        print("📝 Seeding test contracts...")
        test_contracts = [
            ("C001", "MOVIE_001", "Universal", 0.15, 0.001, "US", "2025-01-01", "2026-01-01", 10000, 0.02, 5000),
            ("C002", "MOVIE_002", "Warner Bros", 0.12, 0.0008, "UK", "2025-01-01", "2026-01-01", 8000, 0.025, 4000),
            ("C003", "MOVIE_003", "Sony", 0.18, 0.0012, "CA", "2025-01-01", "2026-01-01", 12000, 0.018, 6000),
            ("C004", "MOVIE_004", "Paramount", 0.10, 0.0006, "AU", "2025-01-01", "2026-01-01", 7000, 0.03, 3500),
            ("C005", "MOVIE_005", "Disney", 0.20, 0.0015, "JP", "2025-01-01", "2026-01-01", 15000, 0.016, 7500),
        ]
        
        cursor.executemany(
            """INSERT INTO contracts (contract_id, content_id, studio, royalty_rate, rate_per_play, 
               territory, start_date, end_date, tier_threshold, tier_rate, min_guarantee)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (contract_id) DO NOTHING""",
            test_contracts
        )
        conn.commit()
        print(f"✅ Seeded {len(test_contracts)} contracts")
        
        # Insert test payments
        print("📝 Seeding test payments...")
        test_payments = [
            ("P001", "C001", "MOVIE_001", 1500, "2025-02-01"),
            ("P002", "C002", "MOVIE_002", 1200, "2025-02-01"),
            ("P003", "C003", "MOVIE_003", 1800, "2025-02-01"),
            ("P004", "C004", "MOVIE_004", 1000, "2025-02-01"),
            ("P005", "C005", "MOVIE_005", 2000, "2025-02-01"),
        ]
        
        cursor.executemany(
            """INSERT INTO payments (payment_id, contract_id, content_id, amount_paid, payment_date)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (payment_id) DO NOTHING""",
            test_payments
        )
        conn.commit()
        print(f"✅ Seeded {len(test_payments)} payments")
        
        # Insert test violations
        print("📝 Seeding test violations...")
        test_violations = [
            ("V001", "C001", "MOVIE_001", "Universal", "UNDERPAYMENT", 1500, 1200, 300, "US", "2025-02-01", "2025-02-28", None),
            ("V002", "C002", "MOVIE_002", "Warner Bros", "OVERPAYMENT", 1200, 1400, -200, "UK", "2025-02-01", "2025-02-28", None),
        ]
        
        cursor.executemany(
            """INSERT INTO violations (violation_id, contract_id, content_id, studio, violation_type,
               expected, paid, difference, territory, start_date, end_date, proof_hash)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (violation_id) DO NOTHING""",
            test_violations
        )
        conn.commit()
        print(f"✅ Seeded {len(test_violations)} violations")
        
        # Insert test streaming logs
        print("📝 Seeding test streaming logs...")
        test_logs = [
            ("LOG001", "MOVIE_001", "C001", "2025-02-15", "US", 100, "user", "web"),
            ("LOG002", "MOVIE_002", "C002", "2025-02-15", "UK", 80, "user", "mobile"),
            ("LOG003", "MOVIE_003", "C003", "2025-02-15", "CA", 120, "user", "web"),
            ("LOG004", "MOVIE_004", "C004", "2025-02-15", "AU", 60, "user", "tablet"),
            ("LOG005", "MOVIE_005", "C005", "2025-02-15", "JP", 150, "user", "web"),
        ]
        
        cursor.executemany(
            """INSERT INTO streaming_logs (play_id, content_id, contract_id, timestamp, country, plays, user_type, device)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            test_logs
        )
        conn.commit()
        print(f"✅ Seeded {len(test_logs)} streaming logs")
        
        # Verify data
        cursor.execute("SELECT COUNT(*) FROM contracts")
        contracts_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM payments")
        payments_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM violations")
        violations_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM streaming_logs")
        logs_count = cursor.fetchone()[0]
        
        print(f"\n✅ Database now contains:")
        print(f"   - {contracts_count} contracts")
        print(f"   - {payments_count} payments")
        print(f"   - {violations_count} violations")
        print(f"   - {logs_count} streaming logs")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("Seeding test data...")
    seed_test_data()
    print("Done!")

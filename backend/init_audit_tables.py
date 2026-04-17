"""
Initialize audit_results table that's missing from migration
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_VcKrwWZ14SfR@ep-bold-paper-ankrarx1.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require")

def init_audit_tables():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Create audit_results table
        cursor.execute("""
            DROP TABLE IF EXISTS audit_results CASCADE;
            CREATE TABLE audit_results (
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
        print("✅ audit_results table created")
        
        # Populate audit_results from contracts and payments
        cursor.execute("""
            INSERT INTO audit_results (
                audit_id, contract_id, content_id, studio,
                expected_payment, actual_payment, difference, violation, timestamp
            )
            SELECT
                'AUD-' || c.contract_id || '-' || EXTRACT(EPOCH FROM NOW())::text as audit_id,
                c.contract_id,
                c.content_id,
                c.studio,
                (c.royalty_rate * 100000)::decimal(12,2) as expected_payment,
                COALESCE(SUM(p.amount_paid), 0) as actual_payment,
                COALESCE(SUM(p.amount_paid), 0) - (c.royalty_rate * 100000)::decimal(12,2) as difference,
                CASE 
                    WHEN ABS(COALESCE(SUM(p.amount_paid), 0) - (c.royalty_rate * 100000)::decimal(12,2)) > 1000 THEN 'UNDERPAYMENT'
                    ELSE 'NONE'
                END as violation,
                CURRENT_TIMESTAMP
            FROM contracts c
            LEFT JOIN payments p ON c.contract_id = p.contract_id
            GROUP BY c.contract_id, c.content_id, c.studio, c.royalty_rate
        """)
        count = cursor.rowcount
        conn.commit()
        print(f"✅ Populated audit_results with {count} records")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("Initializing audit_results table...")
    init_audit_tables()
    print("Done!")

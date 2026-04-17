#!/usr/bin/env python3
"""Check if ORBIT-2026-101 was ingested with violations."""
import psycopg2
from psycopg2.extras import RealDictCursor
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_VcKrwWZ14SfR@ep-bold-paper-ankrarx1.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require")

try:
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if ORBIT contract exists
    print("\n=== ORBIT-2026-101 Contract Status ===\n")
    cursor.execute("SELECT * FROM contracts WHERE contract_id = 'ORBIT-2026-101'")
    contract = cursor.fetchone()
    
    if contract:
        print("✓ Contract found in database:")
        print(f"  - Contract ID: {contract['contract_id']}")
        print(f"  - Studio: {contract['studio']}")
        print(f"  - Territory: {contract['territory']}")
        print(f"  - Min Guarantee: ${contract['min_guarantee']}")
    else:
        print("✗ Contract ORBIT-2026-101 NOT found in contracts table")
    
    # Check audit_results for this contract
    print("\n=== AUDIT_RESULTS for ORBIT-2026-101 ===\n")
    cursor.execute("SELECT audit_id, contract_id, violation, timestamp, expected_payment, actual_payment FROM audit_results WHERE contract_id = 'ORBIT-2026-101'")
    audit_results = cursor.fetchall()
    
    if audit_results:
        for row in audit_results:
            print(f"✓ Audit Record:")
            print(f"  - Violation: {row['violation']}")
            print(f"  - Timestamp: {row['timestamp']}")
            print(f"  - Expected: ${row['expected_payment']}, Actual: ${row['actual_payment']}")
    else:
        print("✗ No audit results for this contract")
    
    # Check violations table for this contract
    print("\n=== VIOLATIONS for ORBIT-2026-101 ===\n")
    cursor.execute("SELECT * FROM violations WHERE contract_id = 'ORBIT-2026-101'")
    violations = cursor.fetchall()
    
    if violations:
        print(f"✓ Found {len(violations)} violations:")
        for v in violations:
            print(f"  - Type: {v['violation_type']}")
            print(f"    Territory: {v['territory']}")
            print(f"    Expected: ${v['expected']}, Paid: ${v['paid']}")
    else:
        print("✗ No violations found for this contract")
    
    # Check streaming_logs for this contract
    print("\n=== STREAMING_LOGS for ORBIT-2026-101 ===\n")
    cursor.execute("SELECT COUNT(*) as cnt, STRING_AGG(DISTINCT country, ',') as countries FROM streaming_logs WHERE contract_id = 'ORBIT-2026-101'")
    logs = cursor.fetchone()
    
    if logs and logs['cnt'] > 0:
        print(f"✓ Found {logs['cnt']} streaming log entries")
        print(f"  Countries: {logs['countries']}")
    else:
        print("✗ No streaming logs for this contract")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"✗ Error: {e}")

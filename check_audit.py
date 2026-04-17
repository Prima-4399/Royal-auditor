#!/usr/bin/env python3
import psycopg2
from psycopg2.extras import RealDictCursor

try:
    conn = psycopg2.connect(
        host="localhost",
        database="royalguard",
        user="postgres",
        password="postgres"
    )
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check if contract was ingested
    print("=" * 70)
    print("1. CHECKING CONTRACTS TABLE FOR QUANTUM-2026-239")
    print("=" * 70)
    cursor.execute("""
        SELECT contract_id, studio, content_id, royalty_rate, rate_per_play, 
               tier_threshold, tier_rate, created_at 
        FROM contracts 
        WHERE contract_id LIKE '%QUANTUM%' OR studio LIKE '%Quantum%'
        LIMIT 5
    """)
    contracts = cursor.fetchall()
    if contracts:
        for c in contracts:
            print(f"Contract ID: {c['contract_id']}")
            print(f"Studio: {c['studio']}")
            print(f"Content: {c['content_id']}")
            print(f"Royalty Rate: {c['royalty_rate']}%")
            print(f"Rate per Play: ${c['rate_per_play']}")
            print(f"Tier Threshold: {c['tier_threshold']}")
            print(f"Tier Rate: ${c['tier_rate']}")
            print(f"Created: {c['created_at']}")
            print()
    else:
        print("❌ No contracts found with 'QUANTUM' in ID or studio name")
    
    # Check audit results for this contract
    print("=" * 70)
    print("2. CHECKING AUDIT RESULTS FOR QUANTUM CONTRACTS")
    print("=" * 70)
    cursor.execute("""
        SELECT a.contract_id, a.expected_payment, a.actual_payment, 
               a.difference, a.violation, a.created_at
        FROM audit_results a
        WHERE a.contract_id LIKE '%QUANTUM%'
        LIMIT 5
    """)
    audits = cursor.fetchall()
    if audits:
        for a in audits:
            print(f"Contract ID: {a['contract_id']}")
            print(f"Expected Payment: ${a['expected_payment']:,.2f}" if a['expected_payment'] else "Expected: None")
            print(f"Actual Payment: ${a['actual_payment']:,.2f}" if a['actual_payment'] else "Actual: None")
            print(f"Difference: ${a['difference']:,.2f}" if a['difference'] else "Difference: None")
            print(f"Violation: {a['violation']}")
            print(f"Audit Created: {a['created_at']}")
            print()
    else:
        print("❌ No audit results found for QUANTUM contracts")
    
    # Check violations table
    print("=" * 70)
    print("3. CHECKING VIOLATIONS TABLE FOR QUANTUM CONTRACTS")
    print("=" * 70)
    cursor.execute("""
        SELECT v.contract_id, v.violation_type, v.difference, v.severity, v.created_at
        FROM violations v
        WHERE v.contract_id LIKE '%QUANTUM%'
        LIMIT 5
    """)
    violations = cursor.fetchall()
    if violations:
        for v in violations:
            print(f"Contract ID: {v['contract_id']}")
            print(f"Violation Type: {v['violation_type']}")
            print(f"Difference: ${v['difference']:,.2f}" if v['difference'] else "Difference: None")
            print(f"Severity: {v['severity']}")
            print(f"Created: {v['created_at']}")
            print()
    else:
        print("✅ No violations found - This means audit is working correctly (no payment discrepancies)")
    
    # Check streaming logs for this contract
    print("=" * 70)
    print("4. CHECKING STREAMING LOGS FOR QUANTUM CONTENT")
    print("=" * 70)
    cursor.execute("""
        SELECT COUNT(*) as total_plays, contract_id
        FROM streaming_logs
        WHERE content_id LIKE '%Quantum%' OR contract_id LIKE '%QUANTUM%'
        GROUP BY contract_id
    """)
    streams = cursor.fetchall()
    if streams:
        for s in streams:
            print(f"Contract ID: {s['contract_id']}")
            print(f"Total Plays: {s['total_plays']:,}")
            print()
    else:
        print("❌ No streaming logs found - This might be why no violations detected")
        print("   (Need streams to calculate expected payments)")
    
    cursor.close()
    conn.close()
    print("✅ Database check complete")
    
except Exception as e:
    print(f"❌ Database Error: {e}")
    import traceback
    traceback.print_exc()

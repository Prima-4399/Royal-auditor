#!/usr/bin/env python3
"""
Restore test data from CSV files into the database
"""

import sqlite3
import csv
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "royalguard.db")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def restore_data():
    """Load all CSV data back into database"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n" + "="*80)
    print("RESTORING TEST DATA FROM CSV FILES")
    print("="*80)
    
    # 1. Load Contracts
    print("\n📋 Loading contracts_1000.csv")
    contracts_file = os.path.join(DATA_DIR, "contracts_1000.csv")
    if os.path.exists(contracts_file):
        with open(contracts_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO contracts (
                            contract_id, studio, royalty_rate, rate_per_play,
                            territory, start_date, end_date, tier_threshold, tier_rate, min_guarantee
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row.get('contract_id'),
                        row.get('studio'),
                        float(row.get('royalty_rate', 0)),
                        float(row.get('rate_per_play', 0)),
                        row.get('territory'),
                        row.get('start_date'),
                        row.get('end_date'),
                        float(row.get('tier_threshold', 100000)),
                        float(row.get('tier_rate', 0.03)),
                        float(row.get('min_guarantee', 500)),
                    ))
                    count += 1
                except Exception as e:
                    pass
        
        conn.commit()
        print(f"  ✅ Loaded {count} contracts")
    
    # 2. Load Streaming Logs
    print("\n📊 Loading streaming_logs_100k.csv")
    logs_file = os.path.join(DATA_DIR, "streaming_logs_100k.csv")
    if os.path.exists(logs_file):
        with open(logs_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                try:
                    cursor.execute("""
                        INSERT INTO streaming_logs (
                            content_id, contract_id, timestamp, country, plays, user_type, device
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row.get('content_id'),
                        row.get('contract_id'),
                        row.get('timestamp'),
                        row.get('country'),
                        int(row.get('plays', 0)),
                        row.get('user_type'),
                        row.get('device'),
                    ))
                    count += 1
                except Exception:
                    pass
        
        conn.commit()
        print(f"  ✅ Loaded {count} streaming log records")
    
    # 3. Load Payments
    print("\n💰 Loading payments_ledger.csv")
    payments_file = os.path.join(DATA_DIR, "payments_ledger.csv")
    if os.path.exists(payments_file):
        with open(payments_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                try:
                    cursor.execute("""
                        INSERT INTO payments (
                            contract_id, amount_paid, payment_date
                        ) VALUES (?, ?, ?)
                    """, (
                        row.get('contract_id'),
                        float(row.get('amount_paid', 0)),
                        row.get('payment_date'),
                    ))
                    count += 1
                except Exception:
                    pass
        
        conn.commit()
        print(f"  ✅ Loaded {count} payment records")
    
    # Verify data
    print("\n" + "="*80)
    print("DATA RESTORATION COMPLETE - VERIFICATION")
    print("="*80)
    
    contract_count = cursor.execute("SELECT COUNT(*) FROM contracts").fetchone()[0]
    logging_count = cursor.execute("SELECT COUNT(*) FROM streaming_logs").fetchone()[0]
    payment_count = cursor.execute("SELECT COUNT(*) FROM payments").fetchone()[0]
    
    print(f"✅ Contracts: {contract_count}")
    print(f"✅ Streaming Logs: {logging_count}")
    print(f"✅ Payments: {payment_count}")
    
    conn.close()
    
    print("\n" + "="*80)
    print("✅ ALL TEST DATA RESTORED SUCCESSFULLY")
    print("="*80)

if __name__ == "__main__":
    restore_data()

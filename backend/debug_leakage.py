import traceback
import psycopg2
from psycopg2.extras import RealDictCursor
import os

DATABASE_URL = "postgresql://neondb_owner:npg_VcKrwWZ14SfR@ep-bold-paper-ankrarx1.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

def get_leakage_summary():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Chart 1: Leakage by studio
        cursor.execute("""
            SELECT studio, SUM(difference) as total_leakage, COUNT(*) as count
            FROM audit_results
            WHERE difference > 0
            GROUP BY studio
            ORDER BY total_leakage DESC
        """)
        by_studio = cursor.fetchall()
        print(f"by_studio: {by_studio[:2] if by_studio else 'empty'}")

        # Chart 2: Leakage by content top 10
        cursor.execute("""
            SELECT content_id, SUM(difference) as total_leakage
            FROM audit_results
            WHERE difference > 0
            GROUP BY content_id
            ORDER BY total_leakage DESC
            LIMIT 10
        """)
        by_content = cursor.fetchall()
        print(f"by_content: {by_content[:2] if by_content else 'empty'}")

        # Chart 3: Over vs under payment
        cursor.execute("""
            SELECT violation,
                   COUNT(*) as count,
                   SUM(ABS(difference)) as total_amount
            FROM audit_results
            WHERE violation IN ('UNDERPAYMENT','OVERPAYMENT')
            GROUP BY violation
        """)
        over_under = cursor.fetchall()
        print(f"over_under: {over_under}")

        # Chart 4: Violations by type
        cursor.execute("""
            SELECT violation_type, COUNT(*) as count, SUM(ABS(COALESCE(difference, 0))) as total_amount
            FROM violations
            WHERE violation_type IN ('EXPIRED_LICENSE', 'TERRITORY_VIOLATION')
            GROUP BY violation_type
        """)
        license_territory = cursor.fetchall()
        print(f"license_territory: {license_territory}")
        
        cursor.execute("""
            SELECT CASE 
                       WHEN violation = 'OVERPAYMENT' THEN 'OVERPAYMENT'
                       WHEN violation = 'UNDERPAYMENT' THEN 'UNDERPAYMENT'
                   END as violation_type,
                   COUNT(*) as count,
                   SUM(ABS(difference)) as total_amount
            FROM audit_results
            WHERE violation IN ('OVERPAYMENT', 'UNDERPAYMENT')
            GROUP BY violation
        """)
        payment_violations = cursor.fetchall()
        print(f"payment_violations: {payment_violations}")
        
        # Combine and sort
        by_type_combined = list(license_territory) + list(payment_violations)
        by_type = sorted(by_type_combined, key=lambda x: x['count'], reverse=True) if by_type_combined else []
        print(f"by_type: {by_type}")

        # KPI summary
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM contracts) as total_contracts,
                COALESCE(SUM(CASE WHEN difference > 0 THEN difference ELSE 0 END), 0) as total_leakage,
                (SELECT COUNT(*) FROM violations) as total_violations,
                CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(CASE WHEN violation = 'NONE' THEN 1 END) * 100.0 / COUNT(*), 1) ELSE 0 END as accuracy
            FROM audit_results
        """)
        kpi = cursor.fetchone()
        print(f"kpi: {kpi}")
        print(f"kpi type: {type(kpi)}")
        
        cursor.close()
        conn.close()
        
        return {
            "kpi": kpi,
            "by_studio":  by_studio,
            "by_content": by_content,
            "over_under": over_under,
            "by_type":    by_type,
        }
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    result = get_leakage_summary()
    import json
    print("\nTrying to convert to JSON:")
    try:
        json_str = json.dumps(result, indent=2, default=str)
        print(json_str[:500])
    except Exception as e:
        print(f"JSON Error: {e}")
        traceback.print_exc()

"""
RoyalGuard AI — Real Multi-Agent Pipeline
Each agent is a real Python class that performs actual DB queries and computations.
No faking. No hardcoded results.
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import time
from datetime import datetime
import hashlib
import json
from typing import Any


class BaseAgent:
    """Base class for all audit agents."""

    name: str = "BaseAgent"
    role: str = ""

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        raise NotImplementedError


class PlannerAgent(BaseAgent):
    """Routes request: loads all contracts and initialises the pipeline context."""

    name = "Planner Agent"
    role = "Routes and orchestrates the full audit pipeline"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        # Load ALL contracts (both base C0001-C1000 and ingested INGEST-*, TEST-*)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM contracts ORDER BY contract_id")
        contracts = cursor.fetchall()
        cursor.close()

        contract_count = len(contracts)
        
        # Log ingested contracts to verify they're being processed
        ingested = [c for c in contracts if not c['contract_id'].startswith('C')]
        if ingested:
            ingested_ids = [c['contract_id'] for c in ingested]
            print(f"[PLANNER] Found {len(ingested)} ingested contract(s): {ingested_ids}", flush=True)
        else:
            print(f"[PLANNER] No ingested contracts found", flush=True)
        
        print(f"[PLANNER] Total contracts loaded: {contract_count}", flush=True)
        
        return {
            "contracts": contracts,
            "detail": f"Loaded {contract_count:,} contracts ({len(ingested)} ingested) and initialised audit pipeline",
            "records_processed": contract_count,
        }


class ContractReaderAgent(BaseAgent):
    """Parses contracts: extracts royalty terms from each contract."""

    name = "Contract Reader Agent"
    role = "Parses contracts and extracts royalty terms"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        contracts = context["contracts"]

        # Build a lookup: contract_id → contract terms
        terms = {}
        territories_found = set()
        studios_found = set()

        for c in contracts:
            terms[c["contract_id"]] = {
                "content_id": c["content_id"],
                "studio": c["studio"],
                "royalty_rate": c["royalty_rate"],
                "rate_per_play": c["rate_per_play"],
                "territory": c["territory"],
                "start_date": c["start_date"],
                "end_date": c["end_date"],
                "tier_threshold": c["tier_threshold"],
                "tier_rate": c["tier_rate"],
                "min_guarantee": c.get("min_guarantee", 0.0),
            }
            for t in c["territory"].split(","):
                territories_found.add(t.strip())
            studios_found.add(c["studio"])

        return {
            "terms": terms,
            "detail": (
                f"Extracted royalty rates, territories, tier thresholds and expiry dates "
                f"from {len(terms):,} contracts across {len(studios_found)} studios "
                f"covering {len(territories_found)} territories"
            ),
            "records_processed": len(terms),
        }


class UsageAgent(BaseAgent):
    """Aggregates streaming logs per contract."""

    name = "Usage Agent"
    role = "Aggregates streaming logs per contract"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        # Aggregate total plays per contract + collect distinct countries played
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # First check total logs
        cursor.execute("SELECT COUNT(*) as cnt FROM streaming_logs")
        total_logs = cursor.fetchone()['cnt']
        print(f"[USAGE] Total streaming_logs in DB: {total_logs}", flush=True)
        
        cursor.execute("""
            SELECT
                contract_id,
                content_id,
                SUM(plays) as total_plays,
                STRING_AGG(DISTINCT country, ',') as countries_played,
                MIN(timestamp) as first_play,
                MAX(timestamp) as last_play,
                COUNT(*) as log_entries
            FROM streaming_logs
            GROUP BY contract_id, content_id
        """)
        rows = cursor.fetchall()
        cursor.close()
        
        if rows:
            print(f"[USAGE] Found usage data for {len(rows)} contracts:", flush=True)
            for row in rows:
                print(f"  {row['contract_id']}: {row['total_plays']} plays, countries: {row['countries_played']}", flush=True)

        usage = {}
        total_plays = 0
        total_entries = 0
        all_countries = set()

        for row in rows:
            usage[row["contract_id"]] = {
                "content_id": row["content_id"],
                "total_plays": row["total_plays"],
                "countries_played": row["countries_played"].split(",") if row["countries_played"] else [],
                "first_play": row["first_play"],
                "last_play": row["last_play"],
            }
            total_plays += row["total_plays"]
            total_entries += row["log_entries"]
            if row["countries_played"]:
                for c in row["countries_played"].split(","):
                    all_countries.add(c.strip())

        return {
            "usage": usage,
            "detail": (
                f"Processed {total_entries:,} play events totaling {total_plays:,} plays "
                f"across {len(all_countries)} territories"
            ),
            "records_processed": len(rows),
        }


class RoyaltyAgent(BaseAgent):
    """Calculates expected royalty using tier logic."""

    name = "Royalty Agent"
    role = "Calculates expected royalty using standard rules"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        terms = context["terms"]
        usage = context["usage"]

        expected_payments = {}
        tier_applied_count = 0
        base_applied_count = 0

        for contract_id, term in terms.items():
            if contract_id not in usage:
                expected_payments[contract_id] = {
                    "expected": 0.0,
                    "tier_used": False,
                    "total_plays": 0,
                    "rate_applied": float(term["rate_per_play"]),
                }
                continue

            u = usage[contract_id]
            total_plays = float(u["total_plays"]) if u["total_plays"] else 0.0

            # If plays < threshold → base_rate, else → tier_rate
            tier_threshold = float(term["tier_threshold"]) if term["tier_threshold"] else 0.0
            if total_plays < tier_threshold:
                rate = float(term["rate_per_play"])
                tier_used = False
                base_applied_count += 1
            else:
                rate = float(term["tier_rate"])
                tier_used = True
                tier_applied_count += 1

            calculated = round(total_plays * rate, 2)
            min_g = float(term.get("min_guarantee", 0.0)) if term.get("min_guarantee") else 0.0
            
            # If calculated < guarantee → use guarantee
            # Ensure rounding to 2 decimal places for comparison consistency
            expected = round(max(calculated, min_g), 2)
            min_guarantee_applied = expected == min_g and expected > 0
            
            expected_payments[contract_id] = {
                "expected": expected,
                "tier_used": tier_used,
                "total_plays": total_plays,
                "rate_applied": rate,
                "min_guarantee_applied": min_guarantee_applied,
            }

        return {
            "expected_payments": expected_payments,
            "detail": (
                f"Applied tier logic: {base_applied_count:,} contracts used base rate, "
                f"{tier_applied_count:,} hit tier threshold — calculated expected royalties for all"
            ),
            "records_processed": len(expected_payments),
        }


class LedgerAgent(BaseAgent):
    """Reads actual payment amounts from the payment ledger."""

    name = "Ledger Agent"
    role = "Reads actual payments from ledger"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT contract_id, content_id, SUM(amount_paid) as total_paid
            FROM payments
            GROUP BY contract_id, content_id
        """)
        rows = cursor.fetchall()
        cursor.close()

        actual_payments = {}
        total_paid = 0.0

        for row in rows:
            paid_amount = float(row["total_paid"]) if row["total_paid"] is not None else 0.0
            actual_payments[row["contract_id"]] = {
                "amount_paid": paid_amount,
                "content_id": row["content_id"],
            }
            total_paid += paid_amount

        return {
            "actual_payments": actual_payments,
            "detail": (
                f"Loaded {len(actual_payments):,} payment records, "
                f"total paid: ${total_paid:,.2f}"
            ),
            "records_processed": len(actual_payments),
        }


class AuditAgent(BaseAgent):
    """Compares expected vs actual payments, flags differences."""

    name = "Audit Agent"
    role = "Compares expected vs actual, flags differences"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        terms = context["terms"]
        expected_payments = context["expected_payments"]
        actual_payments = context["actual_payments"]

        audit_results = []
        underpaid = 0
        overpaid = 0
        correct = 0
        # 🔥 FIX: Use global audit_timestamp from context (fresh for each audit run)
        # This ensures all records in this audit run have the same timestamp
        timestamp = context.get("audit_timestamp", datetime.utcnow().isoformat())
        
        print(f"[AUDIT] Processing {len(terms)} contracts", flush=True)
        print(f"  - Expected payments available for: {len(expected_payments)} contracts", flush=True)
        print(f"  - Actual payments available for: {len(actual_payments)} contracts", flush=True)
        print(f"  - 🔥 CRITICAL: Using audit timestamp: {timestamp} (from context)", flush=True)
        
        # Additional verification
        if "audit_timestamp" in context:
            print(f"[AUDIT] ✓ audit_timestamp FOUND in context", flush=True)
        else:
            print(f"[AUDIT] ⚠️ WARNING: audit_timestamp NOT in context, using fallback", flush=True)

        # Process ALL contracts, including ingested ones with no streaming data
        for i, (contract_id, term) in enumerate(terms.items()):
            exp_data = expected_payments.get(contract_id, {"expected": 0.0})
            act_data = actual_payments.get(contract_id, {"amount_paid": 0.0})

            expected = round(float(exp_data["expected"]), 2)
            actual = round(float(act_data.get("amount_paid", 0.0)), 2)
            difference = round(expected - actual, 2)

            # Use 0.01 threshold to account for rounding artifacts
            if abs(difference) < 0.01:
                violation = "NONE"
                correct += 1
            elif difference > 0:
                violation = "UNDERPAYMENT"
                underpaid += 1
                if expected > 0:  # Only log if there's actual expected payment
                    print(f"[AUDIT] \u2717 UNDERPAYMENT: {contract_id} - expected ${expected}, paid ${actual}, diff ${difference}", flush=True)
            else:
                violation = "OVERPAYMENT"
                overpaid += 1
                print(f"[AUDIT] \u2717 OVERPAYMENT: {contract_id} - expected ${expected}, paid ${actual}, diff ${difference}", flush=True)

            # Governance Proof — generate SHA-256 fingerprint for this specific audit
            raw_data = f"{contract_id}|{expected}|{actual}|{violation}|{timestamp}"
            fingerprint = hashlib.sha256(raw_data.encode()).hexdigest()

            audit_results.append({
                "audit_id": f"AUD{i+1:05d}",
                "contract_id": contract_id,
                "content_id": term["content_id"],
                "studio": term["studio"],
                "expected_payment": expected,
                "actual_payment": actual,
                "difference": difference,
                "violation": violation,
                "timestamp": timestamp,
                "proof_hash": fingerprint,
            })
            
            # Log ingested contracts
            if not contract_id.startswith('C'):
                print(f"[AUDIT]   {contract_id}: expected=${expected}, actual=${actual}, violation={violation}")

        print(f"[AUDIT] Generated {len(audit_results)} audit results (underpaid={underpaid}, overpaid={overpaid}, correct={correct})")
        return {
            "audit_results": audit_results,
            "detail": (
                f"Flagging all rows where paid ≠ expected — "
                f"found {underpaid} underpayments, {overpaid} overpayments, "
                f"{correct} correct across {len(audit_results):,} contracts"
            ),
            "records_processed": len(audit_results),
            "underpaid": underpaid,
            "overpaid": overpaid,
            "correct": correct,
        }


class ViolationAgent(BaseAgent):
    """Checks territory, expiry, and rate tier rules."""

    name = "Violation Agent"
    role = "Checks territory, expiry and rate tier rules"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        terms = context["terms"]
        usage = context["usage"]
        audit_results = context["audit_results"]

        violations = []
        expired_count = 0
        territory_count = 0
        payment_count = 0
        violation_idx = 0
        
        print(f"[VIOLATION] Checking {len(audit_results)} audit results for violations", flush=True)

        for result in audit_results:
            contract_id = result["contract_id"]
            term = terms.get(contract_id, {})
            u = usage.get(contract_id)

            violation_type = None
            violation_reason = ""

            # ========================================================================
            # Check 1: PAYMENT VIOLATIONS (don't need usage or term data)
            # ========================================================================
            if result["violation"] != "NONE":
                violation_type = result["violation"]
                violation_reason = f"Payment mismatch: expected {result['expected_payment']}, actual {result['actual_payment']}"
                payment_count += 1
                print(f"[VIOLATION] ✓ Payment violation found for {contract_id}: {violation_type}", flush=True)
            
            # ========================================================================
            # Check 2: TERRITORY / EXPIRY VIOLATIONS (require usage and term data)
            # ========================================================================
            # Skip territory/expiry checks if no usage or term data
            if not violation_type and (u and term):
                allowed_territories = [t.strip() for t in term.get("territory", "").split(",")]
                end_date = term.get("end_date", "")
                countries_played = u.get("countries_played", [])
                last_play = u.get("last_play", "")

                # Check 2a: Expired license — was content played after contract end date?
                if end_date and last_play:
                    end_date_str = end_date[:10]
                    last_play_str = last_play[:10]
                    if last_play_str > end_date_str:
                        violation_type = "EXPIRED_LICENSE"
                        violation_reason = f"Play date {last_play_str} > contract end {end_date_str}"
                        expired_count += 1
                        # 🔥 FIX: Update the audit result to reflect actual violation found
                        result["violation"] = "EXPIRED_LICENSE"
                        print(f"[VIOLATION] ✓ Expiry violation found for {contract_id}: Updated audit result", flush=True)

                # Check 2b: Territory violation — was content played outside allowed territories?
                if not violation_type and countries_played:
                    for country in countries_played:
                        country_clean = country.strip()
                        if country_clean and country_clean not in allowed_territories:
                            violation_type = "TERRITORY_VIOLATION"
                            violation_reason = f"Country {country_clean} not in allowed: {allowed_territories}"
                            territory_count += 1
                            # 🔥 FIX: Update the audit result to reflect actual violation found
                            result["violation"] = "TERRITORY_VIOLATION"
                            print(f"[VIOLATION] ✓ Territory violation found for {contract_id}: {country_clean} NOT in {allowed_territories} - Updated audit result", flush=True)
                            break

            # Create violation record if any violation was found
            if violation_type:
                violation_idx += 1
                # Governance Proof
                raw_v = f"{contract_id}|{violation_type}|{result['expected_payment']}|{result['actual_payment']}"
                v_hash = hashlib.sha256(raw_v.encode()).hexdigest()

                violations.append({
                    "violation_id": f"VIO{violation_idx:04d}",
                    "contract_id": contract_id,
                    "content_id": result["content_id"],
                    "studio": result["studio"],
                    "violation_type": violation_type,
                    "expected": result["expected_payment"],
                    "paid": result["actual_payment"],
                    "difference": result["difference"],
                    "territory": term.get("territory", "") if term else "",
                    "start_date": term.get("start_date", "") if term else "",
                    "end_date": term.get("end_date", "") if term else "",
                    "proof_hash": v_hash,
                })
                print(f"[VIOLATION] Created violation {violation_idx}: {contract_id} - {violation_type} ({violation_reason})", flush=True)

        return {
            "violations": violations,
            "detail": (
                f"Scanning for contract rule breaches — found {expired_count} expired license violations, "
                f"{territory_count} territory violations, and {payment_count} payment discrepancies "
                f"({len(violations)} total violations)"
            ),
            "records_processed": len(violations),
            "expired_count": expired_count,
            "territory_count": territory_count,
            "payment_count": payment_count,
        }


class ReporterAgent(BaseAgent):
    """Writes computed results to DB and generates final summary."""

    name = "Reporter Agent"
    role = "Writes results to database and builds audit report"

    def run(self, conn: psycopg2.extensions.connection, context: dict) -> dict:
        # 🔥 CRITICAL: Get all required context keys with safety checks
        audit_results = context.get("audit_results", [])
        violations = context.get("violations", [])
        terms = context.get("terms")
        
        print(f"\n[REPORTER] ═══ STARTING REPORTER AGENT ═══", flush=True)
        print(f"[REPORTER] Context state snapshot:", flush=True)
        print(f"  - audit_results: {len(audit_results)} records ✓" if audit_results else f"  - audit_results: 🚨 EMPTY!", flush=True)
        print(f"  - violations: {len(violations)} records ✓" if violations else f"  - violations: 🚨 EMPTY!", flush=True)
        print(f"  - terms: {len(terms)} contracts ✓" if terms else f"  - terms: 🚨 NOT FOUND!", flush=True)
        print(f"  - Full context keys: {list(context.keys())}", flush=True)
        
        # 🔥 CRITICAL: Check if terms exists!
        if not terms:
            print(f"[REPORTER] 🚨🚨🚨 CRITICAL ERROR: 'terms' NOT FOUND in context!", flush=True)
            print(f"[REPORTER] This means NO contracts will be deleted and NO new records inserted!", flush=True)
            terms = {}  # Fallback to empty dict to prevent crash
        else:
            print(f"[REPORTER] ✓ 'terms' found in context with {len(terms)} contracts", flush=True)
        
        # 🔥 CRITICAL: Log the audit_timestamp being used
        audit_timestamp = context.get("audit_timestamp", "NOT FOUND")
        print(f"[REPORTER] ⚠️ Checking audit_timestamp in context: {audit_timestamp}", flush=True)
        
        # Verify timestamps in audit_results
        if audit_results:
            sample_timestamps = set(r.get("timestamp") for r in audit_results[:5])
            print(f"[REPORTER] Sample timestamps from audit_results: {sample_timestamps}", flush=True)
        
        # CRITICAL: Verify contracts table integrity before making changes
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT COUNT(*) as cnt FROM contracts")
        all_contract_count = cursor.fetchone()['cnt']
        cursor.execute(
            "SELECT contract_id FROM contracts WHERE contract_id NOT LIKE 'C____'"
        )
        ingested_contracts = cursor.fetchall()
        ingested_ids = set(c['contract_id'] for c in ingested_contracts) if ingested_contracts else set()
        
        # Get IDs of contracts being processed in THIS audit run
        processed_contract_ids = set(terms.keys())
        
        print(f"[REPORTER] Database state before audit write:")
        print(f"  Total contracts: {all_contract_count}")
        print(f"  Ingested contracts: {len(ingested_ids)} — {list(ingested_ids)}")
        print(f"  Contracts processed in audit: {len(processed_contract_ids)}")
        
        # 🔥 CRITICAL: If terms was empty, this will be 0 and DELETE won't fire!
        if len(processed_contract_ids) == 0:
            print(f"\n[REPORTER] 🚨🚨🚨 CRITICAL ERROR: processed_contract_ids is EMPTY!", flush=True)
            print(f"[REPORTER] This means OLD audit_results will NOT be deleted!", flush=True)
            print(f"[REPORTER] If terms was empty, this is the root cause!", flush=True)
        
        print(f"[REPORTER] 🔥 About to DELETE old audit_results and violations for {len(processed_contract_ids)} contracts", flush=True)

        # PRESERVE existing audit data for ingested contracts NOT in this run
        # Delete only the records for contracts that were reprocessed
        if processed_contract_ids:
            try:
                print(f"[REPORTER] 🔥 DELETING old records for contracts: {list(processed_contract_ids)[:5]}... (showing first 5)", flush=True)
                placeholders = ','.join(['%s'] * len(processed_contract_ids))
                
                # Check what exists before delete
                cursor.execute(f"SELECT COUNT(*) as cnt FROM audit_results WHERE contract_id IN ({placeholders})", 
                            list(processed_contract_ids))
                old_count = cursor.fetchone()['cnt']
                print(f"[REPORTER] Found {old_count} OLD audit_results records to delete", flush=True)
                
                cursor.execute(f"DELETE FROM audit_results WHERE contract_id IN ({placeholders})", 
                            list(processed_contract_ids))
                cursor.execute(f"DELETE FROM violations WHERE contract_id IN ({placeholders})", 
                            list(processed_contract_ids))
                conn.commit()
                print(f"[REPORTER] ✓ Cleaned up old audit data for {len(processed_contract_ids)} contracts")
                print(f"[REPORTER] ✓ After delete - old records should be GONE", flush=True)
            except Exception as e:
                print(f"[REPORTER] ✗ ERROR deleting old data: {e}")
                conn.rollback()

        # INSERT audit results for all contracts processed (using batch for speed)
        print(f"[REPORTER] Inserting {len(audit_results)} audit results...", flush=True)
        try:
            if audit_results:
                # 🔥 DEBUG: Log the timestamps of first few records being inserted
                for i, r in enumerate(audit_results[:3]):
                    print(f"[REPORTER] Record {i}: contract={r['contract_id']}, timestamp={r['timestamp']}", flush=True)
                
                audit_data = [
                    (
                        r["audit_id"], r["contract_id"], r["content_id"], r["studio"],
                        r["expected_payment"], r["actual_payment"], r["difference"],
                        r["violation"], r["timestamp"], r["proof_hash"],
                    )
                    for r in audit_results
                ]
                cursor.executemany(
                    """INSERT INTO audit_results
                       (audit_id, contract_id, content_id, studio,
                        expected_payment, actual_payment, difference, violation, timestamp, proof_hash)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    audit_data
                )
            print(f"[REPORTER] ✓ Inserted {len(audit_results)} audit results (batch) with FRESH timestamps", flush=True)
        except Exception as e:
            print(f"[REPORTER] ✗ ERROR inserting audit results: {e}")
            conn.rollback()
            raise

        # INSERT violations (batch)
        print(f"[REPORTER] Inserting {len(violations)} violations...", flush=True)
        try:
            if violations:
                violation_data = [
                    (
                        v["violation_id"], v["contract_id"], v["content_id"], v["studio"],
                        v["violation_type"], v["expected"], v["paid"], v["difference"],
                        v["territory"], v["start_date"], v["end_date"], v["proof_hash"],
                    )
                    for v in violations
                ]
                cursor.executemany(
                    """INSERT INTO violations
                       (violation_id, contract_id, content_id, studio, violation_type,
                        expected, paid, difference, territory, start_date, end_date, proof_hash)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    violation_data
                )
            print(f"[REPORTER] ✓ Inserted {len(violations)} violations (batch)")
        except Exception as e:
            print(f"[REPORTER] ✗ ERROR inserting violations: {e}")
            conn.rollback()
            raise

        # ─────────────────────────────────────────────────────────────────────────
        # SAFETY NET: Sync EXPIRED & TERRITORY VIOLATIONS TO AUDIT_RESULTS
        # ─────────────────────────────────────────────────────────────────────────
        # ViolationAgent now updates audit_results["violation"] in place when finding
        # EXPIRED_LICENSE or TERRITORY_VIOLATION. This is a safety net for any
        # violations that might have been missed during the pipeline.
        print(f"[REPORTER] Checking for any unsynced EXPIRED_LICENSE/TERRITORY_VIOLATION violations (safety check)...", flush=True)
        try:
            # Find violations that are EXPIRED or TERRITORY that don't have matching audit_results entry
            cursor.execute("""
                SELECT v.violation_id, v.contract_id, v.content_id, v.studio,
                       v.violation_type, v.expected, v.paid, v.difference, v.proof_hash
                FROM violations v
                WHERE v.violation_type IN ('EXPIRED_LICENSE', 'TERRITORY_VIOLATION')
                  AND NOT EXISTS (
                    SELECT 1 FROM audit_results ar 
                    WHERE ar.contract_id = v.contract_id 
                    AND ar.violation IN ('EXPIRED_LICENSE', 'TERRITORY_VIOLATION')
                  )
            """)
            unsynced_violations = cursor.fetchall()
            
            if unsynced_violations:
                # Prepare audit_results entries for these violations (should be rare or zero)
                # 🔥 FIX: Use global audit_timestamp from context (consistent across entire audit)
                timestamp = context.get("audit_timestamp", datetime.utcnow().isoformat())
                audit_data_to_sync = [
                    (
                        v["violation_id"],
                        v["contract_id"],
                        v["content_id"],
                        v["studio"],
                        v["expected"],
                        v["paid"],
                        v["difference"],
                        v["violation_type"],
                        timestamp,
                        v["proof_hash"],
                    )
                    for v in unsynced_violations
                ]
                
                cursor.executemany(
                    """INSERT INTO audit_results
                       (audit_id, contract_id, content_id, studio,
                        expected_payment, actual_payment, difference, violation, timestamp, proof_hash)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (audit_id) DO NOTHING""",
                    audit_data_to_sync
                )
                print(f"[REPORTER] ⚠️ Synced {len(unsynced_violations)} unsynced EXPIRED/TERRITORY violations (should be zero)")
            else:
                print(f"[REPORTER] ✓ All violations properly synced to audit_results (no gaps found)")
        except Exception as e:
            print(f"[REPORTER] ⚠️ Note during safety check: {e}")
            # Don't fail on this, it's just a safety net

        # Final commit
        try:
            conn.commit()
            print(f"[REPORTER] ✓ Database commit successful")
        except Exception as e:
            print(f"[REPORTER] ✗ ERROR committing: {e}")
            raise
        
        cursor.close()

        # Compute final KPIs from freshly written data
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get accurate violation count from violations table (single source of truth)
        cursor.execute("SELECT COUNT(*) as cnt FROM violations")
        total_violations = cursor.fetchone()['cnt']
        
        # Get audited contract count (unique contracts in audit_results)
        cursor.execute("SELECT COUNT(DISTINCT contract_id) as cnt FROM audit_results")
        total_audited = cursor.fetchone()['cnt']
        
        # Calculate total leakage from audit_results
        cursor.execute("SELECT SUM(difference) as sum_diff FROM audit_results WHERE difference > 0")
        leakage_result = cursor.fetchone()
        total_leakage = leakage_result['sum_diff'] if leakage_result['sum_diff'] else 0
        
        # VERIFY: Ensure no contracts were lost during audit
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT COUNT(*) as cnt FROM contracts")
        final_contract_count = cursor.fetchone()['cnt']
        cursor.execute(
            "SELECT contract_id FROM contracts WHERE contract_id NOT LIKE 'C____'"
        )
        final_ingested_rows = cursor.fetchall()
        final_ingested_ids = [c['contract_id'] for c in final_ingested_rows] if final_ingested_rows else []
        
        # Verify audit results in database
        cursor.execute("SELECT COUNT(*) as cnt FROM audit_results")
        db_audit_count = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) as cnt FROM violations")
        db_violation_count = cursor.fetchone()['cnt']
        
        cursor.close()
        
        print(f"[REPORTER] Database verification:")
        print(f"  Contracts: {final_contract_count}")
        print(f"  Audit results in DB: {db_audit_count} (expected: {total_audited})")
        print(f"  Violations in DB: {db_violation_count} (expected: {total_violations})")
        
        # 🔥 FIX: Properly compare sets instead of list vs set
        lost_ingested = ingested_ids - set(final_ingested_ids)
        if final_contract_count != all_contract_count or lost_ingested:
            print(f"[REPORTER] WARNING: Contract count mismatch!")
            print(f"  Before: {all_contract_count} contracts, {len(ingested_ids)} ingested")
            print(f"  After:  {final_contract_count} contracts, {len(final_ingested_ids)} ingested")
            if lost_ingested:
                print(f"  Lost ingested contracts: {lost_ingested}")
        else:
            print(f"[REPORTER] Verification OK: {final_contract_count} contracts preserved ({len(final_ingested_ids)} ingested)")

        return {
            "total_leakage": round(total_leakage, 2),
            "total_violations": total_violations,
            "total_audited": total_audited,
            "detail": (
                f"Wrote {total_audited:,} audit results and {total_violations} violations to database — "
                f"total leakage: ${total_leakage:,.2f}"
            ),
            "records_processed": total_audited + total_violations,
        }


# ── Ingested Contract Processor ───────────────────────────────────────────
def process_ingested_contract(conn: psycopg2.extensions.connection, contract_id: str) -> dict:
    """
    Process a newly ingested contract to make it visible in all tabs.
    1. Creates payment record ($0 paid) → Payments tab
    2. Creates provisional audit result → Audit Results tab
    Audit results will be recalculated when /audit/run is called with real streaming data.
    """
    try:
        # Get the ingested contract
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM contracts WHERE contract_id = %s", (contract_id,))
        contract = cursor.fetchone()
        
        if not contract:
            return {"status": "error", "message": f"Contract {contract_id} not found"}
        
        cursor.close()
        
        # Step 1: Create a default payment record ($0 paid initially - no plays yet)
        # This ensures the contract appears in the Payments tab
        payment_id = f"PMT-{contract_id}"
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO payments 
            (payment_id, contract_id, content_id, amount_paid, payment_date)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (payment_id, contract_id, contract["content_id"], 0.0, datetime.now().date().isoformat()))
        
        # Step 2: Create provisional audit result (contract with no streaming data yet)
        # Expected: 0 (no plays), Actual: 0, Difference: 0
        # This will be recalculated when full audit pipeline runs
        audit_id = f"AUD-{contract_id}"
        proof_hash = hashlib.sha256(f"{contract_id}|0|0|NONE".encode()).hexdigest()
        
        cursor.execute("""
            INSERT INTO audit_results
            (audit_id, contract_id, content_id, studio,
             expected_payment, actual_payment, difference, violation, timestamp, proof_hash)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (audit_id, contract_id, contract["content_id"], contract["studio"],
              0.0, 0.0, 0.0, "NONE", datetime.now().isoformat(), proof_hash))
        
        conn.commit()
        cursor.close()
        
        return {
            "status": "success",
            "message": f"Contract {contract_id} registered in audit system",
            "contract_id": contract_id
        }
    
    except Exception as e:
        cursor.close()
        return {"status": "error", "message": str(e)}


# ── Pipeline orchestrator ─────────────────────────────────────────────────

PIPELINE = [
    PlannerAgent(),
    ContractReaderAgent(),
    UsageAgent(),
    RoyaltyAgent(),
    LedgerAgent(),
    AuditAgent(),
    ViolationAgent(),
    ReporterAgent(),
]


def run_pipeline_step(conn: psycopg2.extensions.connection, agent: BaseAgent, context: dict):
    """Execute a single agent step and return the result with timing."""
    start = time.time()
    result = agent.run(conn, context)
    elapsed = time.time() - start

    # Merge agent output into shared context
    context.update(result)

    return {
        "agent": agent.name,
        "role": agent.role,
        "detail": result.get("detail", ""),
        "records_processed": result.get("records_processed", 0),
        "elapsed_seconds": round(elapsed, 3),
    }

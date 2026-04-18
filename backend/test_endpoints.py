#!/usr/bin/env python3
"""
Quick test of critical endpoints to verify PostgreSQL compatibility
"""
import requests
import json

BASE_URL = "http://localhost:8000"
TIMEOUT = 10

def test_endpoint(method, path, name):
    """Test a single endpoint"""
    try:
        url = f"{BASE_URL}{path}"
        if method == "GET":
            response = requests.get(url, timeout=TIMEOUT)
        else:
            response = requests.post(url, timeout=TIMEOUT)
        
        status = "✅" if response.status_code < 400 else "❌"
        print(f"{status} {name}: {response.status_code}")
        
        # For GET requests, try to get data count
        if response.status_code < 400 and response.text:
            try:
                data = response.json()
                if isinstance(data, dict):
                    if "count" in data:
                        print(f"   → Count: {data['count']}")
                    elif "data" in data and isinstance(data["data"], list):
                        print(f"   → Records: {len(data['data'])}")
                    elif "total_contracts" in data:
                        print(f"   → Contracts: {data['total_contracts']}")
            except:
                pass
        
        return response.status_code < 400
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection refused (server not running?)")
        return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

print("=" * 60)
print("TESTING ROYALGUARD AI BACKEND - PostgreSQL Compatibility")
print("=" * 60)

# Test 1: System Status (basic connectivity)
print("\n1. SYSTEM ENDPOINTS")
test_endpoint("GET", "/system/status", "GET /system/status")

# Test 2: Audit endpoints (cursor-based queries)
print("\n2. AUDIT ENDPOINTS (cursor validation)")
test_endpoint("GET", "/audit/results?limit=5", "GET /audit/results")
test_endpoint("GET", "/audit/log?limit=5", "GET /audit/log")

# Test 3: Notifications (complex cursor usage)
print("\n3. NOTIFICATIONS ENDPOINT (Multi-query test)")
test_endpoint("GET", "/notifications", "GET /notifications")

# Test 4: Contracts (list test)
print("\n4. DATA ENDPOINTS")
test_endpoint("GET", "/contracts?limit=5", "GET /contracts")

# Test 5: Streaming logs
print("\n5. STREAMING & ANALYTICS")
test_endpoint("GET", "/streaming/logs?limit=5", "GET /streaming/logs")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)

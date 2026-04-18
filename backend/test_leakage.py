import requests
import json

# Test /leakage-summary endpoint
try:
    response = requests.get("http://localhost:8000/leakage-summary")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 200:
        data = response.json()
        print("JSON parsed successfully:")
        print(json.dumps(data, indent=2, default=str))
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

# Test /data/reset endpoint  
print("\n" + "="*50 + "\n")
try:
    response = requests.post("http://localhost:8000/data/reset")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 200:
        data = response.json()
        print("JSON parsed successfully:")
        print(json.dumps(data, indent=2, default=str))
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

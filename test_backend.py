import requests
import json

endpoints = {
    'root': 'https://royalguard-ai.onrender.com/',
    'version': 'https://royalguard-ai.onrender.com/version',
    'status': 'https://royalguard-ai.onrender.com/system/status',
    'contracts': 'https://royalguard-ai.onrender.com/contracts'
}

print('Testing Backend Endpoints')
print('=' * 60)

for name, url in endpoints.items():
    try:
        r = requests.get(url, timeout=10)
        cors_header = r.headers.get('Access-Control-Allow-Origin', 'MISSING')
        cors_status = 'YES' if cors_header != 'MISSING' else 'NO'
        
        print(f'{name:12} | Status: {r.status_code:3} | CORS: {cors_status}', end='')
        
        if r.status_code == 200:
            try:
                data = r.json()
                print(f' | Data: OK')
            except:
                print(' | Data: Not JSON')
        else:
            print()
    except Exception as e:
        print(f'{name:12} | ERROR: {str(e)[:40]}')

print('=' * 60)

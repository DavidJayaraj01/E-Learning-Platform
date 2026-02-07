"""Test JWT token generation and validation"""
import requests
import json
from jose import jwt, JWTError

BASE_URL = "http://localhost:8000/api/v1"

# Login
login_data = {
    "email": "test@example.com",
    "password": "TestPassword123!"
}
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print(f"Login Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data["access_token"]
    print(f"\nToken: {token[:50]}...")
    
    # Try to decode the token
    try:
        payload = jwt.decode(token, "iuQK0KodnvcBNWFXMxReuRHuYM5jn6gsRm0OU-RwmL4", algorithms=["HS256"])
        print(f"\nDecoded payload: {json.dumps(payload, indent=2)}")
    except JWTError as e:
        print(f"\nJWT Decode Error: {e}")
    
    # Test /me endpoint
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"\n/me Status: {response.status_code}")
    if response.status_code == 200:
        print(f"/me Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"/me Error: {response.text}")

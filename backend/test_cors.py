#!/usr/bin/env python3
"""
CORS Test Script
Tests if CORS is working properly for the E-Learning Platform API
"""

import requests
import json

def test_cors():
    """Test CORS configuration"""
    base_url = "http://localhost:8000"
    
    # Test preflight request (OPTIONS)
    print("🔍 Testing CORS preflight request...")
    
    headers = {
        "Origin": "http://localhost:5173",  # Vite default port
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
    }
    
    try:
        response = requests.options(f"{base_url}/api/v1/courses", headers=headers)
        print(f"✅ OPTIONS request status: {response.status_code}")
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
            "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials"),
        }
        
        print("📋 CORS Headers:")
        for key, value in cors_headers.items():
            if value:
                print(f"  {key}: {value}")
        
        # Test actual API call
        print("\n🚀 Testing actual API call...")
        api_response = requests.get(f"{base_url}/")
        print(f"✅ GET / status: {api_response.status_code}")
        
        if api_response.status_code == 200:
            print("📄 Response preview:")
            data = api_response.json()
            print(f"  Status: {data.get('status')}")
            print(f"  Message: {data.get('message')}")
        
    except Exception as e:
        print(f"❌ CORS test failed: {e}")

def test_health():
    """Test health endpoint"""
    print("\n🏥 Testing health endpoint...")
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"✅ Health check status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  System status: {data.get('status')}")
            print(f"  Environment: {data.get('environment')}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")

if __name__ == "__main__":
    print("🧪 E-Learning Platform CORS & API Test")
    print("=" * 50)
    test_cors()
    test_health()
    print("\n✨ Test completed!")
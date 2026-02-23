"""Test backend health and API endpoints."""
import requests
import time

backend_url = "https://fitcore-backend.onrender.com"

print("Testing backend health...")
print(f"Backend URL: {backend_url}\n")

# Test health endpoint
try:
    print("1. Testing root endpoint...")
    response = requests.get(f"{backend_url}/", timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✓ Backend is responding")
    else:
        print(f"   ✗ Unexpected status code: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test login endpoint (should return 400 for missing credentials)
try:
    print("\n2. Testing login endpoint...")
    response = requests.post(f"{backend_url}/api/auth/login", json={}, timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code in [400, 401]:
        print("   ✓ Login endpoint is working")
    else:
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test members endpoint (should return 401 for no auth)
try:
    print("\n3. Testing members endpoint (no auth)...")
    response = requests.get(f"{backend_url}/api/admin/members", timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code == 401:
        print("   ✓ Members endpoint requires authentication")
    elif response.status_code == 500:
        print("   ✗ Server error - backend may still be deploying or has issues")
        print(f"   Response: {response.text[:500]}")
    else:
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "="*60)
print("If you see 500 errors, the backend is likely still deploying.")
print("Wait a few minutes and try refreshing your frontend.")
print("="*60)

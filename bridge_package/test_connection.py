"""
Test script to verify bridge configuration and connectivity.
Run this before installing the service to check everything is working.
"""

import socket
import requests
import sys
from pathlib import Path

print("=" * 70)
print("GOFIT ATTENDANCE BRIDGE - CONNECTION TEST")
print("=" * 70)
print()

# Load configuration
config_file = Path(__file__).parent / "config.txt"
config = {
    "CONTROLLER_IP": "192.168.1.150",
    "CONTROLLER_PORT": 8000,
    "APP_URL": "https://yourusername.pythonanywhere.com",
    "SECRET_KEY": "change-this-secret-key"
}

print("[1/5] Loading configuration...")
if not config_file.exists():
    print("❌ ERROR: config.txt not found!")
    sys.exit(1)

try:
    with open(config_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                config[key.strip()] = value.strip()
    print("✓ Configuration loaded")
    print(f"  Controller: {config['CONTROLLER_IP']}:{config['CONTROLLER_PORT']}")
    print(f"  Backend: {config['APP_URL']}")
except Exception as e:
    print(f"❌ ERROR: Failed to load config: {e}")
    sys.exit(1)

print()

# Test 1: Check Python version
print("[2/5] Checking Python version...")
version = sys.version_info
if version.major >= 3 and version.minor >= 7:
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} (OK)")
else:
    print(f"❌ Python {version.major}.{version.minor}.{version.micro} (Need 3.7+)")
    sys.exit(1)

print()

# Test 2: Check required packages
print("[3/5] Checking required packages...")
try:
    import requests
    print(f"✓ requests {requests.__version__}")
except ImportError:
    print("❌ ERROR: 'requests' package not installed")
    print("   Install with: pip install requests")
    sys.exit(1)

print()

# Test 3: Test controller connectivity
print("[4/5] Testing controller connectivity...")
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(5)
    
    # Try to send a simple packet
    test_packet = b'\x00\x00\x00\x00\x00\x00\x00\x00'
    sock.sendto(test_packet, (config['CONTROLLER_IP'], int(config['CONTROLLER_PORT'])))
    
    try:
        response, addr = sock.recvfrom(1024)
        print(f"✓ Controller reachable at {config['CONTROLLER_IP']}:{config['CONTROLLER_PORT']}")
        print(f"  Response received: {len(response)} bytes")
    except socket.timeout:
        print(f"⚠ WARNING: Controller timeout (may be normal if controller is idle)")
        print(f"  Controller IP: {config['CONTROLLER_IP']}")
        print(f"  Controller Port: {config['CONTROLLER_PORT']}")
    
    sock.close()
    
except Exception as e:
    print(f"❌ ERROR: Cannot reach controller: {e}")
    print(f"  Check network connection and controller IP address")

print()

# Test 4: Test backend connectivity
print("[5/5] Testing backend connectivity...")
try:
    # Test heartbeat endpoint
    url = f"{config['APP_URL']}/api/attendance/bridge/heartbeat"
    payload = {
        "secret": config['SECRET_KEY'],
        "pc_ip": "test"
    }
    
    print(f"  Connecting to: {url}")
    response = requests.post(url, json=payload, timeout=10)
    
    if response.status_code == 200:
        print("✓ Backend connection successful")
        print("  Authentication: OK")
    elif response.status_code == 401:
        print("❌ ERROR: Authentication failed")
        print("  Check SECRET_KEY in config.txt matches backend .env")
    else:
        print(f"⚠ WARNING: Unexpected response: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
    
except requests.exceptions.ConnectionError:
    print("❌ ERROR: Cannot connect to backend")
    print("  Check internet connection and APP_URL")
except requests.exceptions.Timeout:
    print("❌ ERROR: Backend request timeout")
    print("  Check internet connection")
except Exception as e:
    print(f"❌ ERROR: {e}")

print()
print("=" * 70)
print("TEST COMPLETE")
print("=" * 70)
print()
print("If all tests passed, you can proceed with installation:")
print("  Right-click install.bat → Run as administrator")
print()
print("If any tests failed, fix the issues before installing.")
print()
input("Press Enter to exit...")

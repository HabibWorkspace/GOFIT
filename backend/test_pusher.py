"""Test script to verify Pusher configuration and send a test notification."""
import os
from dotenv import load_dotenv
from services.pusher_service import PusherService

# Load environment variables
load_dotenv()

def test_pusher_connection():
    """Test Pusher connection and send a test notification."""
    print("=" * 60)
    print("PUSHER CONFIGURATION TEST")
    print("=" * 60)
    
    # Check environment variables
    print("\n1. Checking environment variables...")
    pusher_app_id = os.getenv('PUSHER_APP_ID')
    pusher_key = os.getenv('PUSHER_KEY')
    pusher_secret = os.getenv('PUSHER_SECRET')
    pusher_cluster = os.getenv('PUSHER_CLUSTER', 'ap2')
    
    if not pusher_app_id:
        print("   ❌ PUSHER_APP_ID not found in .env")
        return False
    else:
        print(f"   ✅ PUSHER_APP_ID: {pusher_app_id}")
    
    if not pusher_key:
        print("   ❌ PUSHER_KEY not found in .env")
        return False
    else:
        print(f"   ✅ PUSHER_KEY: {pusher_key}")
    
    if not pusher_secret:
        print("   ❌ PUSHER_SECRET not found in .env")
        return False
    else:
        print(f"   ✅ PUSHER_SECRET: {pusher_secret[:8]}... (hidden)")
    
    print(f"   ✅ PUSHER_CLUSTER: {pusher_cluster}")
    
    # Test Pusher client initialization
    print("\n2. Initializing Pusher client...")
    try:
        client = PusherService.get_client()
        print("   ✅ Pusher client initialized successfully")
    except Exception as e:
        print(f"   ❌ Failed to initialize Pusher client: {str(e)}")
        return False
    
    # Send test notification
    print("\n3. Sending test notification...")
    test_member_data = {
        'id': 'test-123',
        'member_number': 9999,
        'full_name': 'Test Member',
        'card_id': '99999999',
        'profile_picture': None,
        'phone': '0300-1234567',
        'package_name': 'Test Package',
        'check_in_time': '2026-04-16T10:00:00Z',
        'door': 1
    }
    
    try:
        success = PusherService.send_member_checkin(test_member_data)
        if success:
            print("   ✅ Test notification sent successfully!")
            print("\n" + "=" * 60)
            print("SUCCESS! Pusher is configured correctly.")
            print("=" * 60)
            print("\nNext steps:")
            print("1. Open your admin dashboard in the browser")
            print("2. Check the Pusher Debug Console:")
            print("   https://dashboard.pusher.com/")
            print("3. You should see the test event in the debug console")
            print("4. If you're on the dashboard, you should see a notification popup!")
            print("\nChannel: admin-notifications")
            print("Event: member-checkin")
            print("=" * 60)
            return True
        else:
            print("   ❌ Failed to send test notification")
            return False
    except Exception as e:
        print(f"   ❌ Error sending test notification: {str(e)}")
        return False


if __name__ == '__main__':
    # Need Flask app context for logging
    from app import app
    
    with app.app_context():
        success = test_pusher_connection()
        
        if not success:
            print("\n" + "=" * 60)
            print("CONFIGURATION ISSUES DETECTED")
            print("=" * 60)
            print("\nPlease check:")
            print("1. backend/.env file has all Pusher variables")
            print("2. Values match your Pusher dashboard")
            print("3. Internet connection is working")
            print("\nRefer to PUSHER_SETUP_GUIDE.md for detailed instructions")
            print("=" * 60)

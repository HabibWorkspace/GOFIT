"""
Simple startup script for development.
Checks for common issues before starting the server.
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """Check if .env file exists."""
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        print("❌ ERROR: .env file not found!")
        print()
        print("Please run one of these commands first:")
        print("  python quick_setup.py    (recommended - sets up everything)")
        print("  python generate_all_keys.py    (just generates keys)")
        print()
        return False
    return True

def check_required_keys():
    """Check if required environment variables are set."""
    from dotenv import load_dotenv
    load_dotenv()
    
    required_keys = ['SECRET_KEY', 'JWT_SECRET_KEY', 'BRIDGE_SECRET_KEY']
    missing_keys = []
    
    for key in required_keys:
        if not os.getenv(key):
            missing_keys.append(key)
    
    if missing_keys:
        print("❌ ERROR: Missing required environment variables:")
        for key in missing_keys:
            print(f"  - {key}")
        print()
        print("Please run: python quick_setup.py")
        print()
        return False
    
    return True

def check_database():
    """Check if database exists."""
    db_path = Path(__file__).parent / 'instance' / 'fitnix.db'
    if not db_path.exists():
        print("⚠ WARNING: Database not found. It will be created automatically.")
        print()
    return True

def start_server():
    """Start the Flask server."""
    print("=" * 70)
    print("GOFIT GYM MANAGEMENT - STARTING SERVER")
    print("=" * 70)
    print()
    
    # Run checks
    if not check_env_file():
        sys.exit(1)
    
    if not check_required_keys():
        sys.exit(1)
    
    check_database()
    
    print("✓ All checks passed!")
    print()
    print("Starting server...")
    print("  Backend: http://localhost:5000")
    print("  API: http://localhost:5000/api")
    print("  Health: http://localhost:5000/api/health")
    print()
    print("Press Ctrl+C to stop the server")
    print()
    print("-" * 70)
    print()
    
    # Import and run app
    from app import create_app
    app, socketio_instance = create_app()
    
    port = int(os.getenv('PORT', 5000))
    socketio_instance.run(
        app, 
        host='0.0.0.0', 
        port=port, 
        debug=os.getenv('FLASK_ENV') == 'development',
        use_reloader=False
    )

if __name__ == '__main__':
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n\nServer stopped by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ ERROR: {str(e)}")
        print("\nServer failed to start. Please check the error above.")
        sys.exit(1)

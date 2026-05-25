"""
Production server entry point using Waitress (Windows-compatible WSGI server).
This replaces the development server to fix connection reset issues.
"""

import os
import sys
from pathlib import Path

# Set production environment FIRST before loading .env
os.environ['FLASK_ENV'] = 'production'

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables (will not override FLASK_ENV since it's already set)
from dotenv import load_dotenv
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=False)  # Don't override existing env vars

# Import app
from app import create_app

if __name__ == '__main__':
    # Create app with SocketIO
    app, socketio_instance = create_app()
    
    # Get port from environment
    port = int(os.getenv('PORT', 5000))
    host = '0.0.0.0'
    
    print(f"Starting production server on {host}:{port}...")
    print("Using eventlet for SocketIO support")
    
    # Use SocketIO's run method with eventlet for production
    # This is the correct way to run SocketIO in production on Windows
    socketio_instance.run(
        app,
        host=host,
        port=port,
        debug=False,
        use_reloader=False,
        log_output=True
    )

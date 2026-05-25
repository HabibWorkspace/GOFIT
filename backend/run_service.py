"""
Service entry point for Windows service.
This ensures SocketIO runs properly when started as a service.
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Import app
from app import create_app

if __name__ == '__main__':
    # Create app with SocketIO
    app, socketio_instance = create_app()
    
    # Get port from environment
    port = int(os.getenv('PORT', 5000))
    
    # Run with SocketIO (required for WebSocket support)
    print(f"Starting Flask app with SocketIO on port {port}...")
    socketio_instance.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=False,
        use_reloader=False,
        log_output=True
    )

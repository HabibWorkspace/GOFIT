"""
Production server for Gym Management App
Uses Waitress WSGI server for Windows deployment
"""
import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from waitress import serve
from app import create_app

def main():
    """Start production server."""
    # Create Flask app
    app, socketio = create_app()
    
    # Get configuration
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    threads = int(os.getenv('THREADS', 4))
    
    print("=" * 60)
    print("🏋️  Gym Management System - Production Server")
    print("=" * 60)
    print(f"Server: Waitress WSGI")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Threads: {threads}")
    print(f"Environment: {os.getenv('FLASK_ENV', 'production')}")
    print(f"Database: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Not configured')}")
    print("=" * 60)
    print(f"✅ Server running at http://{host}:{port}")
    print(f"✅ Health check: http://localhost:{port}/api/health")
    print(f"✅ Press Ctrl+C to stop")
    print("=" * 60)
    
    try:
        # Serve with Waitress
        serve(
            app,
            host=host,
            port=port,
            threads=threads,
            channel_timeout=120,
            connection_limit=1000,
            cleanup_interval=30,
            asyncore_use_poll=True  # Better for Windows
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

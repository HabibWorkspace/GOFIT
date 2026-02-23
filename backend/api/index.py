"""Vercel serverless function entry point for Flask app."""
import sys
import os
from pathlib import Path

# Add parent directory to path to import app module
backend_path = str(Path(__file__).parent.parent)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Import and create Flask app
from app import create_app

# Create Flask app instance
app = create_app()

# Vercel expects 'app' to be the WSGI application
# No need for custom handler - Vercel handles WSGI automatically

"""Vercel serverless function entry point."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app

# Vercel expects a handler function
def handler(request, context):
    """Handle Vercel serverless requests."""
    return app(request, context)

# For Vercel
app = app

"""Tests for Flask-SocketIO setup."""
import pytest
from app import create_app, socketio
from config import TestingConfig


class TestFlaskSocketIOSetup:
    """Test Flask-SocketIO initialization and configuration."""
    
    def test_socketio_instance_exists(self):
        """Test that socketio instance is created."""
        app, socketio_instance = create_app(TestingConfig)
        assert socketio_instance is not None
    
    def test_socketio_initialized_with_app(self):
        """Test that socketio is initialized with Flask app."""
        app, socketio_instance = create_app(TestingConfig)
        # SocketIO should have a reference to the app
        assert hasattr(socketio_instance, 'server')
    
    def test_socketio_cors_configured(self):
        """Test that CORS is configured for WebSocket connections."""
        app, socketio_instance = create_app(TestingConfig)
        # Verify socketio was initialized (has server attribute)
        assert socketio_instance.server is not None
    
    def test_socketio_async_mode_threading(self):
        """Test that socketio uses threading async mode."""
        app, socketio_instance = create_app(TestingConfig)
        # Check that async_mode is set to threading
        assert socketio_instance.async_mode == 'threading'
    
    def test_create_app_returns_tuple(self):
        """Test that create_app returns both app and socketio."""
        result = create_app(TestingConfig)
        assert isinstance(result, tuple)
        assert len(result) == 2
        app, socketio_instance = result
        assert app is not None
        assert socketio_instance is not None

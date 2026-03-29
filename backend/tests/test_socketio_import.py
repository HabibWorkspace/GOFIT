"""Test that socketio can be imported and used by other modules."""
import pytest


def test_socketio_can_be_imported_from_app():
    """Test that socketio instance can be imported from app module."""
    from app import socketio
    assert socketio is not None


def test_socketio_has_emit_method():
    """Test that socketio instance has emit method for sending events."""
    from app import socketio
    assert hasattr(socketio, 'emit')
    assert callable(socketio.emit)


def test_socketio_has_on_decorator():
    """Test that socketio instance has on decorator for event handlers."""
    from app import socketio
    assert hasattr(socketio, 'on')
    assert callable(socketio.on)


def test_create_app_exports_socketio():
    """Test that create_app returns socketio instance."""
    from app import create_app
    from config import TestingConfig
    
    app, socketio_instance = create_app(TestingConfig)
    assert socketio_instance is not None
    assert hasattr(socketio_instance, 'emit')

"""Tests for logging configuration."""
import os
import logging
import tempfile
import shutil
from logging.handlers import RotatingFileHandler
import pytest


def test_attendance_logging_setup():
    """Test that attendance logging is configured with rotation."""
    from logging_config import setup_attendance_logging
    
    # Setup logging
    setup_attendance_logging()
    
    # Get the attendance service logger
    attendance_logger = logging.getLogger('services.attendance_service')
    biometric_logger = logging.getLogger('services.biometric_service')
    
    # Verify loggers exist and have handlers
    assert attendance_logger is not None
    assert biometric_logger is not None
    assert len(attendance_logger.handlers) > 0
    assert len(biometric_logger.handlers) > 0
    
    # Find the RotatingFileHandler
    rotating_handler = None
    for handler in attendance_logger.handlers:
        if isinstance(handler, RotatingFileHandler):
            rotating_handler = handler
            break
    
    # Verify RotatingFileHandler is configured
    assert rotating_handler is not None, "RotatingFileHandler not found"
    
    # Verify 10MB limit (10 * 1024 * 1024 bytes)
    assert rotating_handler.maxBytes == 10 * 1024 * 1024, f"Expected 10MB limit, got {rotating_handler.maxBytes}"
    
    # Verify backup count
    assert rotating_handler.backupCount == 5, f"Expected 5 backups, got {rotating_handler.backupCount}"
    
    # Verify log file exists
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    log_file = os.path.join(log_dir, 'attendance.log')
    assert os.path.exists(log_dir), f"Log directory not found: {log_dir}"


def test_logging_writes_to_file():
    """Test that logging actually writes to the file."""
    from logging_config import setup_attendance_logging
    
    # Setup logging
    setup_attendance_logging()
    
    # Get logger
    logger = logging.getLogger('services.attendance_service')
    
    # Write a test log message
    test_message = "Test log message for attendance service"
    logger.info(test_message)
    
    # Verify log file exists and contains the message
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    log_file = os.path.join(log_dir, 'attendance.log')
    
    assert os.path.exists(log_file), f"Log file not found: {log_file}"
    
    # Read log file and verify message is present
    with open(log_file, 'r') as f:
        log_content = f.read()
        assert test_message in log_content, f"Test message not found in log file"


def test_log_rotation_configuration():
    """Test that log rotation is properly configured."""
    from logging_config import setup_attendance_logging
    
    # Setup logging
    setup_attendance_logging()
    
    # Get logger
    logger = logging.getLogger('services.attendance_service')
    
    # Find the RotatingFileHandler
    rotating_handler = None
    for handler in logger.handlers:
        if isinstance(handler, RotatingFileHandler):
            rotating_handler = handler
            break
    
    assert rotating_handler is not None
    
    # Verify rotation settings
    assert rotating_handler.maxBytes == 10 * 1024 * 1024  # 10MB
    assert rotating_handler.backupCount == 5  # Keep 5 backups
    
    # Verify formatter is set
    assert rotating_handler.formatter is not None
    
    # Verify format includes timestamp, logger name, level, and message
    format_string = rotating_handler.formatter._fmt
    assert '%(asctime)s' in format_string
    assert '%(name)s' in format_string
    assert '%(levelname)s' in format_string
    assert '%(message)s' in format_string

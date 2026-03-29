"""Logging configuration for the biometric attendance system."""
import logging
import os
from logging.handlers import RotatingFileHandler


def setup_attendance_logging():
    """
    Configure logging for the attendance service with file rotation.
    
    Creates a dedicated log file for attendance operations with:
    - 10MB file size limit
    - Automatic rotation when limit is reached
    - Backup of up to 5 old log files
    - Detailed formatting with timestamp, level, and message
    """
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Define log file path
    log_file = os.path.join(log_dir, 'attendance.log')
    
    # Create rotating file handler with 10MB limit
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB in bytes
        backupCount=5  # Keep up to 5 backup files
    )
    
    # Set log level for file handler
    file_handler.setLevel(logging.INFO)
    
    # Create formatter with detailed information
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    
    # Get loggers for attendance-related modules
    attendance_logger = logging.getLogger('services.attendance_service')
    biometric_logger = logging.getLogger('services.biometric_service')
    
    # Add file handler to loggers
    attendance_logger.addHandler(file_handler)
    biometric_logger.addHandler(file_handler)
    
    # Set log levels
    attendance_logger.setLevel(logging.INFO)
    biometric_logger.setLevel(logging.INFO)
    
    # Prevent propagation to root logger to avoid duplicate logs
    attendance_logger.propagate = False
    biometric_logger.propagate = False
    
    # Also add console handler for development
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    attendance_logger.addHandler(console_handler)
    biometric_logger.addHandler(console_handler)
    
    logging.info("Attendance logging configured with 10MB rotation limit")

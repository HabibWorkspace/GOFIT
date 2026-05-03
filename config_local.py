"""
Flask application configuration for LOCAL Windows deployment.
This replaces config.py for the local migration.
"""
import os
from datetime import timedelta
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.absolute()
DATA_DIR = BASE_DIR / 'data'
LOGS_DIR = BASE_DIR / 'logs'
UPLOADS_DIR = BASE_DIR / 'static' / 'uploads'

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


class Config:
    """Base configuration."""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'local-dev-secret-key-change-in-production')
    
    # Database - SQLite (local file)
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATA_DIR / "gym.db"}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'connect_args': {
            'check_same_thread': False,
            'timeout': 30
        }
    }
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'local-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400)))
    
    # Controller (direct access - same LAN)
    CONTROLLER_IP = '192.168.1.150'
    CONTROLLER_PORT = 8000
    
    # Bridge secret (for attendance sync)
    BRIDGE_SECRET_KEY = os.getenv('BRIDGE_SECRET_KEY', 'change-this-bridge-secret')
    
    # Public URL (Cloudflare Tunnel)
    # Update this after setting up Cloudflare Tunnel
    PUBLIC_URL = os.getenv('PUBLIC_URL', 'http://localhost:5000')
    
    # Gym Configuration
    GYM_LATITUDE = float(os.getenv('GYM_LATITUDE', 40.7128))
    GYM_LONGITUDE = float(os.getenv('GYM_LONGITUDE', -74.0060))
    GEOFENCE_RADIUS_METERS = int(os.getenv('GEOFENCE_RADIUS_METERS', 100))
    
    # External APIs (optional)
    NUTRITIONIX_API_KEY = os.getenv('NUTRITIONIX_API_KEY', '')
    EDAMAM_APP_ID = os.getenv('EDAMAM_APP_ID', '')
    EDAMAM_APP_KEY = os.getenv('EDAMAM_APP_KEY', '')
    
    # Email Configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', os.getenv('MAIL_USERNAME', ''))
    
    # Frontend URL (for CORS)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    # File uploads
    UPLOAD_FOLDER = str(UPLOADS_DIR)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max
    
    # Logging
    LOG_FILE = str(LOGS_DIR / 'app.log')
    ERROR_LOG_FILE = str(LOGS_DIR / 'error.log')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    ENV = 'development'


class ProductionConfig(Config):
    """Production configuration for local Windows deployment."""
    DEBUG = False
    TESTING = False
    ENV = 'production'
    
    # Override with environment variables if set
    SECRET_KEY = os.getenv('SECRET_KEY') or Config.SECRET_KEY
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or Config.JWT_SECRET_KEY
    BRIDGE_SECRET_KEY = os.getenv('BRIDGE_SECRET_KEY') or Config.BRIDGE_SECRET_KEY
    PUBLIC_URL = os.getenv('PUBLIC_URL') or Config.PUBLIC_URL


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=3600)


def get_config():
    """Get configuration based on environment."""
    env = os.getenv('FLASK_ENV', 'production')
    
    if env == 'development':
        return DevelopmentConfig
    elif env == 'testing':
        return TestingConfig
    else:
        return ProductionConfig

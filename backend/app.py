"""Flask application factory."""
# Updated: 2026-02-16 - Added profile picture support
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# DISABLE PYTHON BYTECODE CACHING - Prevents .pyc cache issues
sys.dont_write_bytecode = True

# Load environment variables FIRST before importing config
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Now import everything else
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_mail import Mail
from database import db
from config import get_config

# Initialize extensions
jwt = JWTManager()
socketio = SocketIO()
mail = Mail()


def create_app(config=None):
    """Create and configure Flask application."""
    app = Flask(__name__)
    
    # Disable strict slashes to handle both /path and /path/
    app.url_map.strict_slashes = False
    
    # Load configuration
    if config is None:
        config = get_config()
    app.config.from_object(config)
    
    # Enable detailed logging
    import logging
    
    # Configure logging based on environment
    if app.config.get('ENV') == 'production':
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        app.logger.setLevel(logging.INFO)
    else:
        logging.basicConfig(level=logging.DEBUG)
        app.logger.setLevel(logging.DEBUG)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    
    # Initialize Flask-SocketIO with CORS support
    socketio.init_app(app, 
                     cors_allowed_origins="*",
                     async_mode='threading',
                     logger=True,
                     engineio_logger=True)
    
    # Debug: Log email configuration
    app.logger.info(f"MAIL_SERVER: {app.config.get('MAIL_SERVER')}")
    app.logger.info(f"MAIL_USERNAME: {app.config.get('MAIL_USERNAME')}")
    app.logger.info(f"MAIL_DEFAULT_SENDER: {app.config.get('MAIL_DEFAULT_SENDER')}")
    app.logger.info(f"MAIL_PASSWORD: {'*' * len(app.config.get('MAIL_PASSWORD', '')) if app.config.get('MAIL_PASSWORD') else 'NOT SET'}")
    
    # Configure CORS - Production-ready with environment-based origins
    allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    
    # In production, use specific origins only
    if app.config.get('ENV') == 'production':
        allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
    else:
        # Development: allow localhost
        allowed_origins = "*"
    
    CORS(app, 
         resources={r"/api/*": {
             "origins": allowed_origins,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Cache-Control", "Pragma", "Expires", "X-Requested-With"],
             "supports_credentials": True if app.config.get('ENV') == 'production' else False,
             "expose_headers": ["Content-Type", "Authorization"],
             "max_age": 3600
         }})
    
    # Register blueprints - Admin Only
    from routes.auth import auth_bp
    from routes.admin_complete import admin_complete_bp
    from routes.finance import finance_bp
    from routes.packages import packages_bp
    from routes.attendance import attendance_bp
    from routes.member_profile import member_profile_bp
    from routes.member_details import member_details_bp
    from routes.super_admin import super_admin_bp
    from routes.trainer_commission import trainer_commission_bp
    from routes.supplements import supplements_bp
    from routes.gate import gate_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_complete_bp, url_prefix='/api/admin')
    app.register_blueprint(member_details_bp, url_prefix='/api/admin/member-details')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    app.register_blueprint(packages_bp, url_prefix='/api/packages')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(member_profile_bp, url_prefix='/api/member')
    app.register_blueprint(super_admin_bp, url_prefix='/api/super-admin')
    app.register_blueprint(trainer_commission_bp, url_prefix='/api')
    app.register_blueprint(supplements_bp, url_prefix='/api/supplements')
    app.register_blueprint(gate_bp, url_prefix='/api/gate')
    
    # Add request logging (only in development)
    if app.config.get('ENV') != 'production':
        @app.before_request
        def log_request():
            app.logger.info(f"\n{'='*60}")
            app.logger.info(f"INCOMING REQUEST:")
            app.logger.info(f"Path: {request.path}")
            app.logger.info(f"Method: {request.method}")
            app.logger.info(f"Blueprint: {request.blueprint}")
            app.logger.info(f"Endpoint: {request.endpoint}")
            app.logger.info(f"Headers: {dict(request.headers)}")
            app.logger.info(f"{'='*60}\n")
    
    # Add security headers
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses."""
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # Strict transport security (HTTPS only in production)
        if app.config.get('ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        # Content Security Policy
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:"
        # Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # Permissions policy
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        return response
    
    # Health check endpoint for uptime monitoring
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Simple health check endpoint to keep server alive."""
        return jsonify({
            'status': 'healthy',
            'message': 'FitCore backend is running'
        }), 200
    
    # Debug endpoint to check frontend path
    @app.route('/api/debug/frontend-path', methods=['GET'])
    def debug_frontend_path():
        """Debug endpoint to check frontend directory path."""
        import os
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
        assets_dir = os.path.join(frontend_dir, 'assets')
        return jsonify({
            'frontend_dir': frontend_dir,
            'frontend_exists': os.path.exists(frontend_dir),
            'assets_dir': assets_dir,
            'assets_exists': os.path.exists(assets_dir),
            'assets_files': os.listdir(assets_dir) if os.path.exists(assets_dir) else [],
            '__file__': __file__,
            'dirname': os.path.dirname(__file__)
        }), 200
    
    # Serve frontend static files - DISABLED to test API routes
    # @app.route('/', defaults={'path': ''})
    # @app.route('/<path:path>')
    # def serve_frontend(path):
    #     """Serve frontend files for SPA routing."""
    #     pass
    
    # Add catch-all 404 handler - DISABLED FOR TESTING
    # @app.errorhandler(404)
    # def not_found(error):
    #     return jsonify({'error': 'Not found', 'path': request.path}), 404
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app, socketio


if __name__ == '__main__':
    app, socketio_instance = create_app()
    port = int(os.getenv('PORT', 5000))
    socketio_instance.run(app, host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development', use_reloader=False)
else:
    # For gunicorn
    app, socketio_instance = create_app()

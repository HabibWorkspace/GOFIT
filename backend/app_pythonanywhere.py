"""
PythonAnywhere WSGI entry point.
- No Flask-SocketIO (WSGI only)
- Serves React frontend static files from /static/
- All API routes under /api/
"""
import sys
import os

# ── Path setup ────────────────────────────────────────────────────────────────
# PythonAnywhere: update this to your actual username
# e.g. /home/yourusername/gofit/backend
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

# Load .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(THIS_DIR, '.env'))

os.environ.setdefault('FLASK_ENV', 'production')

# ── App factory ───────────────────────────────────────────────────────────────
from flask import Flask, send_from_directory, send_file
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from database import db
from config import get_config

jwt = JWTManager()
mail = Mail()


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(THIS_DIR, '..', 'frontend', 'dist'),
        static_url_path='/static'
    )
    app.config.from_object(get_config())

    # ── Extensions ────────────────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Allow same-origin requests (frontend served from same domain)
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type", "Authorization",
            "Cache-Control", "Pragma", "Expires", "X-Requested-With"
        ],
        "supports_credentials": False,
    }})

    # ── API Blueprints ────────────────────────────────────────────────────────
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

    # ── Serve React frontend ──────────────────────────────────────────────────
    dist_dir = os.path.join(THIS_DIR, '..', 'frontend', 'dist')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        """Serve React SPA — all non-API routes return index.html."""
        if path.startswith('api/'):
            # Should not reach here, but safety net
            from flask import abort
            abort(404)
        full_path = os.path.join(dist_dir, path)
        if path and os.path.exists(full_path):
            return send_from_directory(dist_dir, path)
        return send_file(os.path.join(dist_dir, 'index.html'))

    # ── Security headers ──────────────────────────────────────────────────────
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

    return app


# PythonAnywhere looks for a variable named 'application'
application = create_app()

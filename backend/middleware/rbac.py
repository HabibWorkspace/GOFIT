"""Role-Based Access Control (RBAC) middleware."""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from typing import List, Union


def require_role(*allowed_roles: str):
    """
    Decorator to enforce role-based access control on endpoints.
    
    Args:
        *allowed_roles: Variable number of role strings (e.g., 'admin', 'trainer', 'member')
        
    Returns:
        Decorated function that checks user role before executing endpoint
        
    Example:
        @app.route('/admin/users')
        @require_role('admin')
        def get_users():
            return {'users': []}
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            
            # Check if user's role is in allowed roles
            if user_role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_admin(fn):
    """
    Decorator to restrict endpoint to admin users only.
    Skips authentication for OPTIONS requests (CORS preflight).
    
    Note: This allows both 'admin' (legacy/receptionist) and 'super_admin' roles.
    For super admin only access, use @require_super_admin decorator.
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function that checks for admin role
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Skip authentication for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return fn(*args, **kwargs)
        
        # Require JWT for all other requests
        from flask_jwt_extended import verify_jwt_in_request, get_jwt
        verify_jwt_in_request()
        
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Allow admin, receptionist, and super_admin roles
        if user_role not in ['admin', 'receptionist', 'super_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


def require_super_admin(fn):
    """
    Decorator to restrict endpoint to super admin (gym owner) only.
    Receptionists and regular admins are blocked.
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function that checks for super_admin role
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Skip authentication for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return '', 200
        
        # Require JWT for all other requests
        from flask_jwt_extended import verify_jwt_in_request, get_jwt
        verify_jwt_in_request()
        
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Only super_admin role allowed
        if user_role != 'super_admin':
            return jsonify({'error': 'Super admin access required'}), 403
        
        # Store current user in g for access in the route
        from flask import g
        from models import User
        user_id = claims.get('sub')
        g.current_user = User.query.get(user_id)
        
        return fn(*args, **kwargs)
    return wrapper


def require_admin_or_receptionist(fn):
    """
    Decorator to allow both admin/receptionist and super_admin roles.
    This is an alias for require_admin for clarity.
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function that checks for admin/receptionist/super_admin role
    """
    return require_admin(fn)


def require_trainer(fn):
    """
    Decorator to restrict endpoint to trainer users only.
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function that checks for trainer role
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Allow OPTIONS requests without authentication (CORS preflight)
        if request.method == 'OPTIONS':
            return '', 200
        
        # For other methods, require JWT authentication
        from flask_jwt_extended import verify_jwt_in_request
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Get claims after verification
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Check if user's role is admin
        if user_role != 'admin':
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def require_trainer(fn):
    """
    Decorator to restrict endpoint to trainer users only.
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function that checks for trainer role
    """
    return require_role('trainer')(fn)


def require_member(fn):
    """
    Decorator to restrict endpoint to member users only.
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function that checks for member role
    """
    return require_role('member')(fn)


def require_any_role(*allowed_roles: str):
    """
    Decorator to allow access to users with any of the specified roles.
    
    Args:
        *allowed_roles: Variable number of role strings
        
    Returns:
        Decorated function that checks if user has any of the allowed roles
        
    Example:
        @app.route('/profile')
        @require_any_role('admin', 'trainer', 'member')
        def get_profile():
            return {'profile': {}}
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            
            if user_role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

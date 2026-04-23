"""Audit logging utility for tracking all system actions."""
from flask import request
from flask_jwt_extended import get_jwt_identity, get_jwt
from database import db
from models import AuditLog, User
import json
from datetime import datetime


def log_action(action, target_type, target_id=None, details=None):
    """
    Log a user action to the audit log.
    
    Args:
        action (str): Description of the action (e.g., "created member", "deleted payment")
        target_type (str): Type of target entity (e.g., "Member", "Payment", "Trainer")
        target_id (str, optional): ID of the target entity
        details (dict, optional): Additional details (before/after values, etc.)
    
    Returns:
        AuditLog: The created audit log entry
    
    Example:
        log_action(
            action="updated member",
            target_type="Member",
            target_id=member.id,
            details={"before": {"phone": "123"}, "after": {"phone": "456"}}
        )
    """
    try:
        # Get current user info from JWT
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role', 'unknown')
        
        # Get IP address
        ip_address = request.remote_addr if request else None
        
        # Create audit log entry
        audit_entry = AuditLog(
            user_id=user_id,
            user_role=user_role,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(audit_entry)
        # Note: Do not commit here - let the calling function handle the commit
        # This allows the audit log to be part of the same transaction
        
        return audit_entry
        
    except Exception as e:
        # Log the error but don't fail the main operation
        print(f"Error creating audit log: {str(e)}")
        return None


def log_action_sync(action, target_type, target_id=None, details=None, user_id=None, user_role=None):
    """
    Log an action synchronously (commits immediately).
    Use this for operations that don't have their own transaction.
    
    Args:
        action (str): Description of the action
        target_type (str): Type of target entity
        target_id (str, optional): ID of the target entity
        details (dict, optional): Additional details
        user_id (str, optional): User ID (if not using JWT context)
        user_role (str, optional): User role (if not using JWT context)
    
    Returns:
        AuditLog: The created audit log entry
    """
    try:
        # Get user info from JWT if not provided
        if not user_id:
            user_id = get_jwt_identity()
        if not user_role:
            claims = get_jwt()
            user_role = claims.get('role', 'unknown')
        
        # Get IP address
        ip_address = request.remote_addr if request else None
        
        # Create audit log entry
        audit_entry = AuditLog(
            user_id=user_id,
            user_role=user_role,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(audit_entry)
        db.session.commit()
        
        return audit_entry
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating audit log: {str(e)}")
        return None


def get_change_details(before, after, fields=None):
    """
    Helper function to generate change details for audit logging.
    
    Args:
        before (dict): Object state before changes
        after (dict): Object state after changes
        fields (list, optional): Specific fields to track. If None, tracks all changed fields.
    
    Returns:
        dict: Dictionary with 'before' and 'after' keys containing only changed fields
    
    Example:
        before = {"name": "John", "phone": "123", "email": "john@example.com"}
        after = {"name": "John", "phone": "456", "email": "john@example.com"}
        result = get_change_details(before, after)
        # Returns: {"before": {"phone": "123"}, "after": {"phone": "456"}}
    """
    changes = {'before': {}, 'after': {}}
    
    # Determine which fields to check
    check_fields = fields if fields else set(list(before.keys()) + list(after.keys()))
    
    for field in check_fields:
        before_value = before.get(field)
        after_value = after.get(field)
        
        # Only include if values are different
        if before_value != after_value:
            changes['before'][field] = before_value
            changes['after'][field] = after_value
    
    return changes if changes['before'] or changes['after'] else None

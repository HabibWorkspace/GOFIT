"""Gate control routes for remote turnstile operation."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.rbac import require_super_admin
from database import db
from models import GateCommand, MemberProfile, User, UserRole
from utils.audit import log_action
from datetime import datetime, timedelta
import os

gate_bp = Blueprint('gate', __name__)

# Secret key for bridge authentication (from environment)
BRIDGE_SECRET = os.getenv('BRIDGE_SECRET_KEY', 'change-this-secret-key-in-production')


def verify_bridge_secret():
    """Verify the bridge secret key from query params or JSON body."""
    secret = request.args.get('secret') or request.get_json().get('secret')
    return secret == BRIDGE_SECRET


@gate_bp.route('/pending-commands', methods=['GET'])
def get_pending_commands():
    """
    Get pending gate commands for bridge script to execute.
    Bridge polls this endpoint every 3 seconds.
    
    Query params:
        - secret: Bridge authentication secret key
    
    Returns:
        {
            "commands": [
                {
                    "id": "uuid",
                    "door": 1,
                    "member_id": "uuid",
                    "created_at": "2026-04-28T10:00:00Z"
                }
            ]
        }
    
    Security:
        - Requires valid bridge secret key
        - Only returns commands created within last 30 seconds (prevents stale commands)
        - Commands older than 30 seconds are automatically marked as 'expired'
    """
    try:
        # Validate secret key
        if not verify_bridge_secret():
            current_app.logger.warning(f"Invalid bridge secret from {request.remote_addr}")
            return jsonify({'error': 'Invalid secret key'}), 401
        
        now = datetime.utcnow()
        thirty_seconds_ago = now - timedelta(seconds=30)
        
        # Mark old pending commands as expired (safety measure)
        expired_commands = GateCommand.query.filter(
            GateCommand.status == 'pending',
            GateCommand.created_at < thirty_seconds_ago
        ).all()
        
        for cmd in expired_commands:
            cmd.status = 'expired'
            cmd.error_message = 'Command expired (not executed within 30 seconds)'
        
        if expired_commands:
            current_app.logger.info(f"Marked {len(expired_commands)} commands as expired")
        
        # Get fresh pending commands (created within last 30 seconds)
        pending_commands = GateCommand.query.filter(
            GateCommand.status == 'pending',
            GateCommand.created_at >= thirty_seconds_ago
        ).order_by(GateCommand.created_at.asc()).all()
        
        commands_list = []
        for cmd in pending_commands:
            commands_list.append({
                'id': cmd.id,
                'door': cmd.door,
                'member_id': cmd.member_id,
                'created_at': cmd.created_at.isoformat() + 'Z'
            })
        
        db.session.commit()
        
        if commands_list:
            current_app.logger.info(f"Returning {len(commands_list)} pending gate commands to bridge")
        
        return jsonify({'commands': commands_list}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error fetching pending gate commands: {str(e)}")
        return jsonify({'error': str(e)}), 500


@gate_bp.route('/confirm-command', methods=['POST'])
def confirm_command():
    """
    Confirm gate command execution from bridge script.
    Bridge calls this after attempting to execute a command.
    
    Expected JSON:
        {
            "command_id": "uuid",
            "success": true,
            "error": null,
            "secret": "bridge-secret-key"
        }
    
    Returns:
        {"status": "ok"}
    
    Security:
        - Requires valid bridge secret key
    """
    try:
        data = request.get_json()
        
        # Validate secret key
        if not verify_bridge_secret():
            current_app.logger.warning(f"Invalid bridge secret from {request.remote_addr}")
            return jsonify({'error': 'Invalid secret key'}), 401
        
        command_id = data.get('command_id')
        success = data.get('success', False)
        error = data.get('error')
        
        if not command_id:
            return jsonify({'error': 'command_id is required'}), 400
        
        # Find command
        command = GateCommand.query.get(command_id)
        
        if not command:
            current_app.logger.warning(f"Gate command not found: {command_id}")
            return jsonify({'error': 'Command not found'}), 404
        
        # Update command status
        command.status = 'executed' if success else 'failed'
        command.executed_at = datetime.utcnow()
        if error:
            command.error_message = error
        
        db.session.commit()
        
        status_msg = 'executed successfully' if success else f'failed: {error}'
        current_app.logger.info(f"Gate command {command_id} {status_msg}")
        
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error confirming gate command: {str(e)}")
        return jsonify({'error': str(e)}), 500


@gate_bp.route('/command-status/<command_id>', methods=['GET'])
@jwt_required()
def get_command_status(command_id):
    """
    Get status of a gate command.
    Used by frontend to poll command execution status.
    
    Returns:
        {
            "status": "pending" | "executed" | "failed" | "expired",
            "error_message": "..." (if failed)
        }
    
    Security:
        - Requires member to be logged in
        - Only returns status for commands belonging to current user's member_id
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get command
        command = GateCommand.query.get(command_id)
        
        if not command:
            return jsonify({'error': 'Command not found'}), 404
        
        # Security check: only allow member to check their own commands
        # or allow admin/super_admin to check any command
        if user.role == UserRole.MEMBER:
            member = MemberProfile.query.filter_by(user_id=user_id).first()
            if not member or command.member_id != member.id:
                return jsonify({'error': 'Unauthorized'}), 403
        elif user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.SCANNER]:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'status': command.status,
            'error_message': command.error_message
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching command status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@gate_bp.route('/manual-open', methods=['POST'])
@require_super_admin
def manual_open():
    """
    Manually trigger gate open from admin dashboard.
    Super admin only.
    
    Expected JSON:
        {
            "door": 1  # 1 or 2
        }
    
    Returns:
        {
            "status": "command_queued",
            "command_id": "uuid",
            "message": "Gate command sent — opens in ~3 seconds"
        }
    """
    try:
        data = request.get_json()
        door = data.get('door', 1)
        
        if door not in [1, 2]:
            return jsonify({'error': 'Door must be 1 or 2'}), 400
        
        # Create gate command
        command = GateCommand(
            member_id=None,  # Manual open has no associated member
            door=door,
            status='pending',
            triggered_by='manual'
        )
        db.session.add(command)
        db.session.flush()
        
        # Log the action
        log_action(
            action='manual gate open',
            target_type='GateCommand',
            target_id=command.id,
            details={'door': door}
        )
        
        db.session.commit()
        
        current_app.logger.info(f"Manual gate open command created: door {door}, command_id {command.id}")
        
        return jsonify({
            'status': 'command_queued',
            'command_id': command.id,
            'message': f'Gate {door} command sent — opens in ~3 seconds'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating manual gate command: {str(e)}")
        return jsonify({'error': str(e)}), 500


@gate_bp.route('/recent-commands', methods=['GET'])
@require_super_admin
def get_recent_commands():
    """
    Get recent gate commands for admin dashboard.
    Super admin only.
    
    Query params:
        - limit: Number of commands to return (default 20, max 100)
    
    Returns:
        {
            "commands": [
                {
                    "id": "uuid",
                    "door": 1,
                    "status": "executed",
                    "triggered_by": "qr",
                    "member_name": "John Doe",
                    "member_number": 123,
                    "created_at": "2026-04-28T10:00:00Z",
                    "executed_at": "2026-04-28T10:00:03Z",
                    "error_message": null
                }
            ]
        }
    """
    try:
        limit = min(request.args.get('limit', 20, type=int), 100)
        
        commands = GateCommand.query.order_by(
            GateCommand.created_at.desc()
        ).limit(limit).all()
        
        commands_list = []
        for cmd in commands:
            member = MemberProfile.query.get(cmd.member_id) if cmd.member_id else None
            
            commands_list.append({
                **cmd.to_dict(),
                'member_name': member.full_name if member else 'Manual Open',
                'member_number': member.member_number if member else None
            })
        
        return jsonify({'commands': commands_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching recent gate commands: {str(e)}")
        return jsonify({'error': str(e)}), 500


@gate_bp.route('/stats/today', methods=['GET'])
@require_super_admin
def get_today_stats():
    """
    Get today's gate command statistics.
    Super admin only.
    
    Returns:
        {
            "total_commands": 45,
            "executed": 43,
            "failed": 1,
            "expired": 1,
            "success_rate": 95.6
        }
    """
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Get today's commands
        today_commands = GateCommand.query.filter(
            GateCommand.created_at >= today_start,
            GateCommand.created_at < today_end
        ).all()
        
        total = len(today_commands)
        executed = sum(1 for cmd in today_commands if cmd.status == 'executed')
        failed = sum(1 for cmd in today_commands if cmd.status == 'failed')
        expired = sum(1 for cmd in today_commands if cmd.status == 'expired')
        
        success_rate = (executed / total * 100) if total > 0 else 0
        
        return jsonify({
            'total_commands': total,
            'executed': executed,
            'failed': failed,
            'expired': expired,
            'success_rate': round(success_rate, 1)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching gate stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

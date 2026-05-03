"""Super Admin routes - Gym owner dashboard and management."""
from flask import Blueprint, request, jsonify, current_app
from middleware.rbac import require_super_admin
from database import db
from models import (
    User, UserRole, MemberProfile, Transaction, TransactionStatus,
    Attendance, AuditLog, Package, TrainerProfile
)
from services.password_service import PasswordService
from utils.audit import log_action, get_change_details
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, extract
import csv
from io import StringIO

super_admin_bp = Blueprint('super_admin', __name__)


@super_admin_bp.route('/dashboard/stats', methods=['GET'])
@require_super_admin
def get_dashboard_stats():
    """
    Get super admin dashboard statistics.
    
    Returns:
        - Today's total revenue
        - Today's check-ins count
        - Outstanding dues count and amount
        - Last 7 days revenue chart data
        - Recent audit log entries
        - Low stock alerts (placeholder for supplements feature)
    """
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Today's total revenue (completed payments)
        today_revenue = db.session.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.paid_date >= today_start,
                Transaction.paid_date < today_end,
                Transaction.status == TransactionStatus.COMPLETED
            )
        ).scalar() or 0
        
        # Today's check-ins count
        today_checkins = Attendance.query.filter(
            and_(
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end,
                Attendance.direction == 'entry'
            )
        ).count()
        
        # Outstanding dues (pending + overdue transactions)
        outstanding_dues = db.session.query(
            func.count(Transaction.id).label('count'),
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.status.in_([TransactionStatus.PENDING, TransactionStatus.OVERDUE])
        ).first()
        
        outstanding_count = outstanding_dues.count or 0
        outstanding_amount = float(outstanding_dues.total or 0)
        
        # Last 7 days revenue data for chart
        seven_days_ago = today_start - timedelta(days=6)
        revenue_by_day = []
        
        for i in range(7):
            day_start = seven_days_ago + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            day_revenue = db.session.query(func.sum(Transaction.amount)).filter(
                and_(
                    Transaction.paid_date >= day_start,
                    Transaction.paid_date < day_end,
                    Transaction.status == TransactionStatus.COMPLETED
                )
            ).scalar() or 0
            
            revenue_by_day.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'day': day_start.strftime('%a'),
                'revenue': float(day_revenue)
            })
        
        # Recent audit log (last 20 actions)
        recent_audits = AuditLog.query.order_by(
            AuditLog.timestamp.desc()
        ).limit(20).all()
        
        audit_list = []
        for audit in recent_audits:
            user = User.query.get(audit.user_id)
            audit_list.append({
                **audit.to_dict(),
                'username': user.username if user else 'Unknown'
            })
        
        # Active members count
        active_members = MemberProfile.query.filter(
            and_(
                MemberProfile.package_expiry_date > datetime.utcnow(),
                MemberProfile.is_frozen == False
            )
        ).count()
        
        # Total members count
        total_members = MemberProfile.query.count()
        
        return jsonify({
            'today_revenue': float(today_revenue),
            'today_checkins': today_checkins,
            'outstanding_dues': {
                'count': outstanding_count,
                'amount': outstanding_amount
            },
            'revenue_chart': revenue_by_day,
            'recent_audits': audit_list,
            'active_members': active_members,
            'total_members': total_members,
            'low_stock_alerts': []  # Placeholder for supplements feature
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching super admin dashboard stats: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/finance/report', methods=['GET'])
@require_super_admin
def get_finance_report():
    """
    Get comprehensive financial report.
    
    Query params:
        - start_date: Start date (YYYY-MM-DD)
        - end_date: End date (YYYY-MM-DD)
        - month: Month (YYYY-MM) - alternative to date range
    
    Returns:
        - Total revenue by source (membership, trainer fees, supplements)
        - Monthly breakdown
        - Profit/loss calculations
    """
    try:
        # Parse date range
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        month_str = request.args.get('month')
        
        if month_str:
            # Parse month (YYYY-MM)
            year, month = map(int, month_str.split('-'))
            start_date = datetime(year, month, 1)
            # Last day of month
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
        elif start_date_str and end_date_str:
            start_date = datetime.fromisoformat(start_date_str)
            end_date = datetime.fromisoformat(end_date_str) + timedelta(days=1)
        else:
            # Default to current month
            now = datetime.utcnow()
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end_date = now.replace(year=now.year + 1, month=1, day=1)
            else:
                end_date = now.replace(month=now.month + 1, day=1)
        
        # Total revenue
        total_revenue = db.session.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.paid_date >= start_date,
                Transaction.paid_date < end_date,
                Transaction.status == TransactionStatus.COMPLETED
            )
        ).scalar() or 0
        
        # Revenue by type
        revenue_by_type = db.session.query(
            Transaction.transaction_type,
            func.sum(Transaction.amount).label('total')
        ).filter(
            and_(
                Transaction.paid_date >= start_date,
                Transaction.paid_date < end_date,
                Transaction.status == TransactionStatus.COMPLETED
            )
        ).group_by(Transaction.transaction_type).all()
        
        revenue_breakdown = {
            'admission': 0,
            'package': 0,
            'payment': 0
        }
        
        for trans_type, total in revenue_by_type:
            revenue_breakdown[trans_type.value.lower()] = float(total)
        
        # Trainer fees (total paid to trainers)
        trainer_fees_total = db.session.query(func.sum(Transaction.trainer_fee)).filter(
            and_(
                Transaction.paid_date >= start_date,
                Transaction.paid_date < end_date,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.trainer_fee > 0
            )
        ).scalar() or 0
        
        # Net revenue after trainer commissions
        net_revenue = float(total_revenue) - float(trainer_fees_total)
        
        # Monthly breakdown (if date range spans multiple months)
        months_data = []
        current_month = start_date.replace(day=1)
        
        while current_month < end_date:
            next_month = current_month.replace(day=28) + timedelta(days=4)
            next_month = next_month.replace(day=1)
            
            month_revenue = db.session.query(func.sum(Transaction.amount)).filter(
                and_(
                    Transaction.paid_date >= current_month,
                    Transaction.paid_date < next_month,
                    Transaction.status == TransactionStatus.COMPLETED
                )
            ).scalar() or 0
            
            months_data.append({
                'month': current_month.strftime('%Y-%m'),
                'month_name': current_month.strftime('%B %Y'),
                'revenue': float(month_revenue)
            })
            
            current_month = next_month
        
        return jsonify({
            'period': {
                'start': start_date.strftime('%Y-%m-%d'),
                'end': (end_date - timedelta(days=1)).strftime('%Y-%m-%d')
            },
            'total_revenue': float(total_revenue),
            'revenue_breakdown': revenue_breakdown,
            'trainer_fees_paid': float(trainer_fees_total),
            'net_revenue': net_revenue,
            'monthly_breakdown': months_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error generating finance report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/users', methods=['GET'])
@require_super_admin
def get_users():
    """Get all receptionist/admin users (excluding super admins)."""
    try:
        users = User.query.filter(
            User.role.in_([UserRole.ADMIN, UserRole.RECEPTIONIST])
        ).order_by(User.created_at.desc()).all()
        
        users_list = []
        for user in users:
            users_list.append({
                **user.to_dict(),
                'can_delete': True  # All receptionists can be deactivated
            })
        
        return jsonify({'users': users_list}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/users', methods=['POST'])
@require_super_admin
def create_receptionist():
    """Create a new receptionist account."""
    try:
        data = request.get_json()
        
        # Validate required fields
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        full_name = data.get('full_name', '').strip()
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create new receptionist user
        password_hash = PasswordService.hash_password(password)
        
        new_user = User(
            username=username,
            password_hash=password_hash,
            role=UserRole.RECEPTIONIST,
            is_active=True
        )
        
        db.session.add(new_user)
        db.session.flush()  # Get the user ID
        
        # Log the action
        log_action(
            action='created receptionist',
            target_type='User',
            target_id=new_user.id,
            details={'username': username, 'full_name': full_name}
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Receptionist created successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating receptionist: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/users/<user_id>/toggle-active', methods=['POST'])
@require_super_admin
def toggle_user_active(user_id):
    """Activate or deactivate a receptionist account."""
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deactivating super admin accounts
        if user.role == UserRole.SUPER_ADMIN:
            return jsonify({'error': 'Cannot deactivate super admin account'}), 403
        
        # Toggle active status
        old_status = user.is_active
        user.is_active = not user.is_active
        
        # Log the action
        log_action(
            action='deactivated receptionist' if not user.is_active else 'activated receptionist',
            target_type='User',
            target_id=user.id,
            details={
                'username': user.username,
                'before': {'is_active': old_status},
                'after': {'is_active': user.is_active}
            }
        )
        
        db.session.commit()
        
        return jsonify({
            'message': f"User {'deactivated' if not user.is_active else 'activated'} successfully",
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error toggling user status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/audit-logs', methods=['GET'])
@require_super_admin
def get_audit_logs():
    """
    Get audit logs with pagination and filtering.
    
    Query params:
        - page: Page number (default 1)
        - per_page: Items per page (default 50)
        - user_id: Filter by user ID
        - action: Filter by action type
        - target_type: Filter by target type
        - start_date: Filter by start date
        - end_date: Filter by end date
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        user_id = request.args.get('user_id')
        action = request.args.get('action')
        target_type = request.args.get('target_type')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Build query
        query = AuditLog.query
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if action:
            query = query.filter(AuditLog.action.ilike(f'%{action}%'))
        
        if target_type:
            query = query.filter(AuditLog.target_type == target_type)
        
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
            query = query.filter(AuditLog.timestamp >= start_date)
        
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str) + timedelta(days=1)
            query = query.filter(AuditLog.timestamp < end_date)
        
        # Order by timestamp descending
        query = query.order_by(AuditLog.timestamp.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Get user details for each log
        logs_list = []
        for log in pagination.items:
            user = User.query.get(log.user_id)
            logs_list.append({
                **log.to_dict(),
                'username': user.username if user else 'Unknown'
            })
        
        return jsonify({
            'logs': logs_list,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching audit logs: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/settings', methods=['GET'])
@require_super_admin
def get_settings():
    """Get system settings."""
    try:
        from models import Settings
        
        settings = Settings.query.first()
        
        if not settings:
            # Create default settings
            settings = Settings(
                admission_fee=0,
                grace_period_days=3,
                trainer_commission_percent=50
            )
            db.session.add(settings)
            db.session.commit()
        
        # Get additional settings
        packages = Package.query.filter_by(is_active=True).all()
        
        return jsonify({
            'admission_fee': float(settings.admission_fee),
            'grace_period_days': settings.grace_period_days,
            'trainer_commission_percent': settings.trainer_commission_percent,
            'active_packages': [p.to_dict() for p in packages]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching settings: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/settings', methods=['PUT'])
@require_super_admin
def update_settings():
    """Update system settings."""
    try:
        from models import Settings
        
        data = request.get_json()
        settings = Settings.query.first()
        
        if not settings:
            settings = Settings()
            db.session.add(settings)
        
        # Track changes
        before = {
            'admission_fee': float(settings.admission_fee),
            'grace_period_days': settings.grace_period_days,
            'trainer_commission_percent': settings.trainer_commission_percent
        }
        
        # Update fields
        if 'admission_fee' in data:
            settings.admission_fee = data['admission_fee']
        
        if 'grace_period_days' in data:
            settings.grace_period_days = data['grace_period_days']
        
        if 'trainer_commission_percent' in data:
            settings.trainer_commission_percent = data['trainer_commission_percent']
        
        after = {
            'admission_fee': float(settings.admission_fee),
            'grace_period_days': settings.grace_period_days,
            'trainer_commission_percent': settings.trainer_commission_percent
        }
        
        # Log the action
        log_action(
            action='updated settings',
            target_type='Settings',
            target_id=settings.id,
            details=get_change_details(before, after)
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Settings updated successfully',
            'admission_fee': float(settings.admission_fee),
            'grace_period_days': settings.grace_period_days,
            'trainer_commission_percent': settings.trainer_commission_percent
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating settings: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/update-credentials', methods=['PUT', 'OPTIONS'])
@require_super_admin
def update_credentials():
    """Update super admin login credentials (username and/or password)."""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        from flask import g
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_username = data.get('new_username', '').strip()
        new_password = data.get('new_password', '').strip()
        
        # Get current user
        current_user = g.current_user
        
        # Validate at least one field is being updated
        if not new_username and not new_password:
            return jsonify({'error': 'Please provide new username or new password'}), 400
        
        # If updating password, current password is required
        if new_password:
            if not current_password:
                return jsonify({'error': 'Current password is required to change password'}), 400
            
            # Verify current password
            if not PasswordService.verify_password(current_password, current_user.password_hash):
                return jsonify({'error': 'Current password is incorrect'}), 401
            
            if len(new_password) < 6:
                return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Track changes
        before = {'username': current_user.username}
        changes = []
        
        # Update username if provided (no password verification needed - user is already authenticated)
        if new_username:
            # Check if username already exists
            existing_user = User.query.filter(
                User.username == new_username,
                User.id != current_user.id
            ).first()
            
            if existing_user:
                return jsonify({'error': 'Username already exists'}), 400
            
            current_user.username = new_username
            changes.append('username')
        
        # Update password if provided
        if new_password:
            current_user.password_hash = PasswordService.hash_password(new_password)
            changes.append('password')
        
        after = {'username': current_user.username}
        
        # Log the action
        log_action(
            action=f"updated credentials ({', '.join(changes)})",
            target_type='User',
            target_id=current_user.id,
            details=get_change_details(before, after)
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Credentials updated successfully',
            'username': current_user.username
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating credentials: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/members-report', methods=['GET'])
@require_super_admin
def get_members_report():
    """
    Get overdue payments and inactive members for the Members Report page.
    Returns:
        - overdue_payments: members with pending/overdue transactions
        - inactive_members: members with no check-in in the last 10 days
        - summary stats
    """
    try:
        now = datetime.utcnow()
        ten_days_ago = now - timedelta(days=10)

        # ── OVERDUE PAYMENTS ──────────────────────────────────────────────
        overdue_txns = Transaction.query.filter(
            Transaction.status.in_([TransactionStatus.PENDING, TransactionStatus.OVERDUE]),
            Transaction.due_date < now
        ).order_by(Transaction.due_date.asc()).all()

        overdue_list = []
        for txn in overdue_txns:
            member = MemberProfile.query.get(txn.member_id)
            if not member or member.is_frozen:
                continue
            days_overdue = (now - txn.due_date).days
            package = Package.query.get(member.current_package_id) if member.current_package_id else None
            overdue_list.append({
                'member_id': member.id,
                'member_number': member.member_number,
                'full_name': member.full_name or 'N/A',
                'phone': member.phone or 'N/A',
                'amount': float(txn.amount),
                'due_date': txn.due_date.isoformat() + 'Z',
                'days_overdue': days_overdue,
                'package_name': package.name if package else 'N/A',
                'transaction_id': txn.id,
                'status': txn.status.value,
            })

        # ── INACTIVE MEMBERS ──────────────────────────────────────────────
        active_members = MemberProfile.query.filter_by(is_frozen=False).all()

        inactive_list = []
        for member in active_members:
            # Only flag members who have attended at least once
            first_attendance = Attendance.query.filter_by(member_id=member.id).first()
            if not first_attendance:
                continue

            recent = Attendance.query.filter(
                Attendance.member_id == member.id,
                Attendance.check_in_time >= ten_days_ago
            ).first()

            if recent:
                continue  # attended recently — not inactive

            # Find last check-in date
            last_attendance = Attendance.query.filter_by(
                member_id=member.id
            ).order_by(Attendance.check_in_time.desc()).first()

            days_inactive = (now - last_attendance.check_in_time).days if last_attendance else None
            package = Package.query.get(member.current_package_id) if member.current_package_id else None

            inactive_list.append({
                'member_id': member.id,
                'member_number': member.member_number,
                'full_name': member.full_name or 'N/A',
                'phone': member.phone or 'N/A',
                'package_name': package.name if package else 'N/A',
                'package_expiry_date': member.package_expiry_date.isoformat() + 'Z' if member.package_expiry_date else None,
                'last_checkin': last_attendance.check_in_time.isoformat() + 'Z' if last_attendance else None,
                'days_inactive': days_inactive,
            })

        # Sort inactive by days_inactive descending (longest inactive first)
        inactive_list.sort(key=lambda x: x['days_inactive'] or 0, reverse=True)

        total_overdue_amount = sum(m['amount'] for m in overdue_list)

        return jsonify({
            'overdue_payments': overdue_list,
            'inactive_members': inactive_list,
            'summary': {
                'overdue_count': len(overdue_list),
                'overdue_total_amount': total_overdue_amount,
                'inactive_count': len(inactive_list),
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching members report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@super_admin_bp.route('/gate/recent-commands', methods=['GET'])
@require_super_admin
def get_gate_recent_commands():
    """
    Get recent gate commands for admin dashboard.
    Proxy to gate blueprint for convenience.
    """
    from models import GateCommand
    
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


@super_admin_bp.route('/gate/stats', methods=['GET'])
@require_super_admin
def get_gate_stats():
    """
    Get gate command statistics for admin dashboard.
    """
    from models import GateCommand
    
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

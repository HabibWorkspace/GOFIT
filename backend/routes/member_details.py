"""Member details route - separate file to avoid route conflicts."""
from flask import Blueprint, jsonify
from models.member_profile import MemberProfile
from models.user import User
from models.package import Package
from models.trainer_profile import TrainerProfile
from models.transaction import Transaction, TransactionStatus, TransactionType
from middleware.rbac import require_admin
from datetime import datetime, timedelta

member_details_bp = Blueprint('member_details', __name__)


@member_details_bp.route('/', methods=['GET'])
@require_admin
def get_member_details():
    """Get comprehensive member details including history, transactions, and attendance."""
    print("=== MEMBER DETAILS ROUTE CALLED ===")
    from flask import request
    from models.attendance import Attendance
    from sqlalchemy import extract, func
    
    member_id = request.args.get('id')
    print(f"Member ID: {member_id}")
    if not member_id:
        return jsonify({'error': 'Member ID is required'}), 400
    
    member = MemberProfile.query.get(member_id)
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    
    # Basic member info
    member_dict = member.to_dict()
    user = User.query.get(member.user_id)
    if user:
        member_dict['username'] = user.username
        # Include plain password for attendance login credentials display
        member_dict['password'] = getattr(user, 'password', None)
    
    # Current package info
    if member.current_package_id:
        package = Package.query.get(member.current_package_id)
        if package:
            member_dict['current_package'] = {
                'id': package.id,
                'name': package.name,
                'price': float(package.price),
                'duration_days': package.duration_days,
                'description': package.description
            }
    
    # Current trainer info
    if member.trainer_id:
        trainer = TrainerProfile.query.get(member.trainer_id)
        if trainer:
            member_dict['current_trainer'] = {
                'id': trainer.id,
                'full_name': trainer.full_name,
                'specialization': trainer.specialization,
                'phone': trainer.phone,
                'email': trainer.email
            }
    
    # Get all transactions
    transactions = Transaction.query.filter_by(member_id=member_id).order_by(Transaction.due_date.desc()).all()
    member_dict['transactions'] = [txn.to_dict() for txn in transactions]
    
    # Build membership history
    membership_history = []
    for txn in transactions:
        if txn.transaction_type == TransactionType.PACKAGE and txn.status == TransactionStatus.COMPLETED:
            if member.current_package_id:
                package = Package.query.get(member.current_package_id)
                if package and txn.due_date:
                    start_date = txn.paid_date if txn.paid_date else txn.due_date
                    end_date = start_date + timedelta(days=package.duration_days)
                    
                    period = {
                        'package_name': package.name,
                        'start_date': start_date.isoformat() + 'Z',
                        'end_date': end_date.isoformat() + 'Z',
                        'amount_paid': float(txn.amount),
                        'payment_date': txn.paid_date.isoformat() + 'Z' if txn.paid_date else None,
                        'trainer_name': None
                    }
                    
                    if member.trainer_id:
                        trainer = TrainerProfile.query.get(member.trainer_id)
                        if trainer:
                            period['trainer_name'] = trainer.full_name
                    
                    membership_history.append(period)
    
    member_dict['membership_history'] = membership_history
    
    # Attendance statistics
    attendance_records = Attendance.query.filter_by(member_id=member_id).all()
    total_checkins = len(attendance_records)
    
    # Monthly breakdown
    monthly_attendance = {}
    current_date = datetime.utcnow()
    
    for i in range(12):
        month_date = current_date - timedelta(days=30 * i)
        month_key = month_date.strftime('%Y-%m')
        month_name = month_date.strftime('%b %Y')
        
        month_count = Attendance.query.filter(
            Attendance.member_id == member_id,
            extract('year', Attendance.check_in_time) == month_date.year,
            extract('month', Attendance.check_in_time) == month_date.month
        ).count()
        
        monthly_attendance[month_key] = {
            'month': month_name,
            'count': month_count
        }
    
    # Attendance rate
    attendance_rate = 0
    days_attended = 0
    if member.package_start_date and member.package_expiry_date:
        days_in_period = (member.package_expiry_date - member.package_start_date).days
        
        days_attended = Attendance.query.filter(
            Attendance.member_id == member_id,
            Attendance.check_in_time >= member.package_start_date,
            Attendance.check_in_time <= member.package_expiry_date
        ).distinct(func.date(Attendance.check_in_time)).count()
        
        if days_in_period > 0:
            attendance_rate = round((days_attended / days_in_period) * 100, 1)
    
    member_dict['attendance_stats'] = {
        'total_checkins': total_checkins,
        'monthly_breakdown': monthly_attendance,
        'attendance_rate': attendance_rate,
        'days_attended_current_period': days_attended
    }
    
    # Calculate inactive status
    # Member is inactive if: has attended before BUT not in last 10 days
    is_inactive = False
    if not member.is_frozen:  # Only check for active members
        # Check if member has ANY attendance record
        has_attended_before = Attendance.query.filter(
            Attendance.member_id == member_id
        ).first()
        
        if has_attended_before:
            # Check if member has recent attendance (last 10 days)
            ten_days_ago = current_date - timedelta(days=10)
            recent_attendance = Attendance.query.filter(
                Attendance.member_id == member_id,
                Attendance.check_in_time >= ten_days_ago
            ).first()
            
            # If attended before but not recently, mark as inactive
            if not recent_attendance:
                is_inactive = True
    
    member_dict['is_inactive'] = is_inactive
    
    return jsonify(member_dict), 200

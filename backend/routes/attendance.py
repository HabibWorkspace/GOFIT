"""Attendance routes for RFID card-based check-in system."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Attendance, BridgeHeartbeat, UnknownCard, MemberProfile, User, UserRole
from datetime import datetime, timedelta
from sqlalchemy import func, and_
import os

attendance_bp = Blueprint('attendance', __name__)

# Secret key for bridge authentication (from environment)
BRIDGE_SECRET = os.getenv('BRIDGE_SECRET_KEY', 'change-this-secret-key-in-production')


def verify_bridge_secret(secret):
    """Verify the bridge secret key."""
    return secret == BRIDGE_SECRET


def is_admin():
    """Check if current user is admin, receptionist, or super_admin."""
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"is_admin check - User ID: {user_id}")
        
        if not user_id:
            current_app.logger.error("is_admin - No user_id from JWT")
            return False
        
        user = User.query.get(user_id)
        
        if not user:
            current_app.logger.error(f"is_admin - User not found: {user_id}")
            return False
        
        current_app.logger.info(f"is_admin - User role: {user.role}, Type: {type(user.role)}")
        
        allowed_roles = [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]
        result = user and user.role in allowed_roles
        
        current_app.logger.info(f"is_admin - Allowed roles: {allowed_roles}")
        current_app.logger.info(f"is_admin - Result: {result}")
        
        return result
    except Exception as e:
        current_app.logger.error(f"is_admin - Exception: {str(e)}", exc_info=True)
        return False


def is_admin_or_scanner():
    """Check if current user is admin, receptionist, super_admin, or scanner."""
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"is_admin_or_scanner - User ID: {user_id}")
        
        if not user_id:
            current_app.logger.error("is_admin_or_scanner - No user_id from JWT")
            return False
            
        user = User.query.get(user_id)
        
        if not user:
            current_app.logger.error(f"is_admin_or_scanner - User not found: {user_id}")
            return False
        
        current_app.logger.info(f"is_admin_or_scanner - User role: {user.role}, Type: {type(user.role)}")
        
        # Allow admin, receptionist, super_admin, and scanner roles
        allowed_roles = [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.SCANNER]
        result = user and user.role in allowed_roles
        current_app.logger.info(f"is_admin_or_scanner - Result: {result}")
        return result
    except Exception as e:
        current_app.logger.error(f"is_admin_or_scanner - Exception: {str(e)}", exc_info=True)
        return False


@attendance_bp.route('/sync', methods=['POST'])
def sync_attendance():
    """
    Sync attendance records from bridge script.
    
    Expected JSON:
    {
        "records": [
            {
                "card_id": "12345678",
                "door": 1,
                "direction": "entry",
                "timestamp": "2026-04-14T09:30:00"
            }
        ],
        "secret": "your-secret-key"
    }
    
    Returns:
    {
        "synced": 3,
        "skipped": 1,
        "unknown_cards": ["99999999"]
    }
    """
    try:
        from services.pusher_service import PusherService
        from models import Package
        
        data = request.get_json()
        
        # Validate secret key
        if not verify_bridge_secret(data.get('secret')):
            return jsonify({'error': 'Invalid secret key'}), 401
        
        records = data.get('records', [])
        synced_count = 0
        skipped_count = 0
        unknown_cards = []
        
        for record in records:
            card_id = record.get('card_id')
            door = record.get('door')
            direction = record.get('direction')
            timestamp_str = record.get('timestamp')
            
            # Parse timestamp
            try:
                check_in_time = datetime.fromisoformat(timestamp_str.replace('Z', ''))
            except:
                current_app.logger.error(f"Invalid timestamp format: {timestamp_str}")
                skipped_count += 1
                continue
            
            # Look up member by card_id
            member = MemberProfile.query.filter_by(card_id=card_id).first()
            
            if not member:
                # Log unknown card
                unknown_card = UnknownCard.query.filter_by(card_id=card_id).first()
                if unknown_card:
                    unknown_card.last_seen = datetime.utcnow()
                    unknown_card.scan_count += 1
                else:
                    unknown_card = UnknownCard(
                        card_id=card_id,
                        door=door,
                        direction=direction,
                        timestamp=check_in_time
                    )
                    db.session.add(unknown_card)
                
                if card_id not in unknown_cards:
                    unknown_cards.append(card_id)
                skipped_count += 1
                continue
            
            # Check for duplicate (same member + same timestamp within 1 minute)
            existing = Attendance.query.filter(
                and_(
                    Attendance.member_id == member.id,
                    Attendance.check_in_time >= check_in_time - timedelta(minutes=1),
                    Attendance.check_in_time <= check_in_time + timedelta(minutes=1)
                )
            ).first()
            
            if existing:
                current_app.logger.info(f"Duplicate record skipped for member {member.member_number}")
                skipped_count += 1
                continue
            
            # Create attendance record
            attendance = Attendance(
                member_id=member.id,
                check_in_time=check_in_time,
                door=door,
                direction=direction,
                method='card',
                synced_from_controller=True
            )
            db.session.add(attendance)
            synced_count += 1
            
            # Send real-time notification to admin dashboard (only for entry)
            if direction == 'entry':
                try:
                    from models import Transaction, TransactionStatus
                    
                    # Get package name if member has one
                    package_name = None
                    if member.current_package_id:
                        package = Package.query.get(member.current_package_id)
                        if package:
                            package_name = package.name
                    
                    # Calculate member status and days remaining/overdue
                    status = 'inactive'
                    days_info = None
                    now = datetime.utcnow()
                    
                    if member.package_expiry_date:
                        if member.package_expiry_date > now:
                            # Package is still valid - check for overdue payments
                            overdue_transactions = Transaction.query.filter(
                                and_(
                                    Transaction.member_id == member.id,
                                    Transaction.status == TransactionStatus.PENDING,
                                    Transaction.due_date < now - timedelta(days=3)
                                )
                            ).all()
                            
                            if overdue_transactions:
                                status = 'overdue'
                                oldest_due_date = min(t.due_date for t in overdue_transactions)
                                days_overdue = (now - oldest_due_date).days
                                days_info = {
                                    'type': 'overdue',
                                    'days': days_overdue
                                }
                            else:
                                status = 'active'
                                days_remaining = (member.package_expiry_date - now).days
                                days_info = {
                                    'type': 'remaining',
                                    'days': days_remaining
                                }
                        else:
                            # Package expired
                            status = 'inactive'
                            days_overdue = (now - member.package_expiry_date).days
                            days_info = {
                                'type': 'overdue',
                                'days': days_overdue
                            }
                    
                    # Prepare member data for notification
                    member_data = {
                        'id': member.id,
                        'member_number': member.member_number,
                        'full_name': member.full_name,
                        'profile_picture': member.profile_picture,
                        'phone': member.phone,
                        'package_name': package_name,
                        'check_in_time': check_in_time.isoformat() + 'Z',
                        'door': door,
                        'status': status,
                        'days_info': days_info
                    }
                    
                    # Send Pusher notification
                    PusherService.send_member_checkin(member_data)
                    
                except Exception as pusher_error:
                    # Don't fail the sync if Pusher fails
                    current_app.logger.error(f"Failed to send Pusher notification: {str(pusher_error)}")
        
        # Update bridge heartbeat
        heartbeat = BridgeHeartbeat.query.first()
        if heartbeat:
            heartbeat.last_seen = datetime.utcnow()
            heartbeat.records_synced_today += synced_count
        else:
            heartbeat = BridgeHeartbeat(
                last_seen=datetime.utcnow(),
                pc_ip=request.remote_addr,
                records_synced_today=synced_count
            )
            db.session.add(heartbeat)
        
        db.session.commit()
        
        return jsonify({
            'synced': synced_count,
            'skipped': skipped_count,
            'unknown_cards': unknown_cards
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error syncing attendance: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/bridge/heartbeat', methods=['POST'])
def bridge_heartbeat():
    """
    Update bridge heartbeat status.
    
    Expected JSON:
    {
        "secret": "your-secret-key",
        "pc_ip": "192.168.1.20"
    }
    """
    try:
        data = request.get_json()
        
        # Validate secret key
        if not verify_bridge_secret(data.get('secret')):
            return jsonify({'error': 'Invalid secret key'}), 401
        
        pc_ip = data.get('pc_ip', request.remote_addr)
        
        # Update or create heartbeat
        heartbeat = BridgeHeartbeat.query.first()
        if heartbeat:
            heartbeat.last_seen = datetime.utcnow()
            heartbeat.pc_ip = pc_ip
        else:
            heartbeat = BridgeHeartbeat(
                last_seen=datetime.utcnow(),
                pc_ip=pc_ip,
                records_synced_today=0
            )
            db.session.add(heartbeat)
        
        db.session.commit()
        
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating heartbeat: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_attendance():
    """Get all attendance records for today (admin only)."""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        # Get today's date range
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Query today's attendance
        records = Attendance.query.filter(
            and_(
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
        ).order_by(Attendance.check_in_time.desc()).all()
        
        # Get member details
        attendance_list = []
        for record in records:
            member = MemberProfile.query.get(record.member_id)
            user = User.query.get(member.user_id) if member else None
            
            attendance_list.append({
                **record.to_dict(),
                'member_name': member.full_name if member else 'Unknown',
                'member_number': member.member_number if member else None,
                'card_id': member.card_id if member else None,
            })
        
        # Count unique members who checked in today
        unique_member_ids = set(record.member_id for record in records)
        unique_members_count = len(unique_member_ids)
        
        # Group by hour for chart data
        hourly_data = {}
        for record in records:
            hour = record.check_in_time.hour
            hourly_data[hour] = hourly_data.get(hour, 0) + 1
        
        # Format hourly data for chart
        chart_data = {
            'labels': [f"{h:02d}:00" for h in range(24)],
            'data': [hourly_data.get(h, 0) for h in range(24)]
        }
        
        return jsonify({
            'records': attendance_list,
            'total_checkins': unique_members_count,
            'chart_data': chart_data
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching today's attendance: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/member/<member_id>', methods=['GET'])
@jwt_required()
def get_member_attendance(member_id):
    """Get attendance history for a specific member (admin only)."""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 30, type=int)
        
        # Query member's attendance
        pagination = Attendance.query.filter_by(member_id=member_id).order_by(
            Attendance.check_in_time.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Get member details
        member = MemberProfile.query.get(member_id)
        
        records = [record.to_dict() for record in pagination.items]
        
        return jsonify({
            'records': records,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'member_name': member.full_name if member else 'Unknown',
            'member_number': member.member_number if member else None,
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching member attendance: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/checkin/manual', methods=['POST'])
@jwt_required()
def manual_checkin():
    """Manually check in a member (admin only)."""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        member_id = data.get('member_id')
        
        if not member_id:
            return jsonify({'error': 'member_id is required'}), 400
        
        # Verify member exists
        member = MemberProfile.query.get(member_id)
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        # Create attendance record
        attendance = Attendance(
            member_id=member_id,
            check_in_time=datetime.utcnow(),
            door=0,  # Manual check-in has no door
            direction='entry',
            method='manual',
            synced_from_controller=False
        )
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify({
            'message': 'Member checked in successfully',
            'attendance': attendance.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error manual check-in: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/export', methods=['GET'])
@jwt_required()
def export_attendance():
    """Export attendance records as CSV (admin only)."""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        from flask import make_response
        import csv
        from io import StringIO
        
        # Get date range from query params
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        member_id = request.args.get('member_id')
        
        # Build query
        query = Attendance.query
        
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
            query = query.filter(Attendance.check_in_time >= start_date)
        
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str)
            query = query.filter(Attendance.check_in_time <= end_date)
        
        if member_id:
            query = query.filter_by(member_id=member_id)
        
        records = query.order_by(Attendance.check_in_time.desc()).all()
        
        # Create CSV
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(['Date', 'Time', 'Member ID', 'Member Name', 'Card ID', 'Door', 'Direction', 'Method'])
        
        for record in records:
            member = MemberProfile.query.get(record.member_id)
            writer.writerow([
                record.check_in_time.strftime('%Y-%m-%d'),
                record.check_in_time.strftime('%H:%M:%S'),
                member.member_number if member else 'N/A',
                member.full_name if member else 'Unknown',
                member.card_id if member else 'N/A',
                record.door,
                record.direction,
                record.method
            ])
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = f"attachment; filename=attendance_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        output.headers["Content-type"] = "text/csv"
        
        return output
        
    except Exception as e:
        current_app.logger.error(f"Error exporting attendance: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/bridge/status', methods=['GET'])
@jwt_required()
def get_bridge_status():
    """Get bridge connection status (admin only)."""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        heartbeat = BridgeHeartbeat.query.first()
        
        if not heartbeat:
            return jsonify({
                'status': 'never_connected',
                'online': False,
                'last_seen': None,
                'records_synced_today': 0
            }), 200
        
        # Check if online (heartbeat within last 10 minutes)
        ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
        is_online = heartbeat.last_seen >= ten_minutes_ago
        
        return jsonify({
            'status': 'online' if is_online else 'offline',
            'online': is_online,
            'last_seen': heartbeat.last_seen.isoformat() + 'Z',
            'pc_ip': heartbeat.pc_ip,
            'records_synced_today': heartbeat.records_synced_today
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching bridge status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/unknown-cards', methods=['GET'])
@jwt_required()
def get_unknown_cards():
    """Get list of unknown RFID cards (admin only)."""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        unknown_cards = UnknownCard.query.order_by(UnknownCard.last_seen.desc()).all()
        
        return jsonify({
            'unknown_cards': [card.to_dict() for card in unknown_cards]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching unknown cards: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/overdue-alerts', methods=['GET'])
@jwt_required()
def get_overdue_alerts():
    """Get list of overdue members who checked in today (admin only)."""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        from models import Transaction, TransactionStatus, Settings
        
        # Get grace period from settings
        settings = Settings.query.first()
        grace_period_days = settings.grace_period_days if settings else 3
        
        # Get today's date range
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Get today's attendance records
        today_records = Attendance.query.filter(
            and_(
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
        ).all()
        
        overdue_alerts = []
        
        for record in today_records:
            member = MemberProfile.query.get(record.member_id)
            if not member:
                continue
            
            # Check if member has overdue payments (past grace period)
            overdue_transactions = Transaction.query.filter(
                and_(
                    Transaction.member_id == member.id,
                    Transaction.status == TransactionStatus.PENDING,
                    Transaction.due_date < datetime.utcnow() - timedelta(days=grace_period_days)
                )
            ).all()
            
            if overdue_transactions:
                # Calculate total overdue amount
                total_overdue = sum(t.amount for t in overdue_transactions)
                oldest_due_date = min(t.due_date for t in overdue_transactions)
                days_overdue = (datetime.utcnow() - oldest_due_date).days - grace_period_days
                
                overdue_alerts.append({
                    'member_id': member.id,
                    'member_number': member.member_number,
                    'member_name': member.full_name,
                    'phone': member.phone,
                    'card_id': member.card_id,
                    'check_in_time': record.check_in_time.isoformat() + 'Z',
                    'total_overdue': total_overdue,
                    'overdue_count': len(overdue_transactions),
                    'days_overdue': days_overdue,
                    'oldest_due_date': oldest_due_date.isoformat() + 'Z',
                })
        
        return jsonify({
            'overdue_alerts': overdue_alerts
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching overdue alerts: {str(e)}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/generate-session-qr', methods=['POST'])
@jwt_required()
def generate_session_qr():
    """
    Generate a time-limited session QR code for attendance check-in.
    Admin access only.
    
    Returns:
    {
        "qr_code": "data:image/png;base64,...",
        "expires_at": "2026-04-14T10:00:00Z",
        "session_id": "123456789"
    }
    """
    if not is_admin_or_scanner():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        import qrcode
        import io
        import base64
        import random
        
        # Generate 9-digit session ID (easy to remember)
        session_id = ''.join([str(random.randint(0, 9)) for _ in range(9)])
        expires_at = datetime.utcnow() + timedelta(seconds=30)
        
        # Create QR data with session info
        qr_data = {
            'type': 'session_checkin',
            'session_id': session_id,
            'expires_at': expires_at.isoformat() + 'Z',
            'gym': 'GOFIT'
        }
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(str(qr_data))
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        # Store session in cache/database (for now, we'll validate on scan)
        # In production, store session_id in Redis with expiry
        
        return jsonify({
            'qr_code': f'data:image/png;base64,{img_str}',
            'expires_at': expires_at.isoformat() + 'Z',
            'session_id': session_id
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error generating session QR: {str(e)}")
        return jsonify({'error': 'Failed to generate QR code'}), 500


@attendance_bp.route('/check-in-qr', methods=['POST'])
@jwt_required()
def check_in_qr():
    """
    Process QR code scan for attendance check-in.
    Can be member's personal QR or session QR.
    
    Expected JSON:
    {
        "qr_data": "member_id_or_session_data"
    }
    
    Returns:
    {
        "success": true,
        "member_name": "John Doe",
        "message": "Check-in successful"
    }
    """
    try:
        data = request.get_json()
        qr_data = data.get('qr_data')
        
        if not qr_data:
            return jsonify({'error': 'QR data required'}), 400
        
        # Try to parse as member ID first
        try:
            # Check if it's a member's personal QR (contains member_id)
            if 'member_id' in qr_data or qr_data.isdigit():
                member_id = qr_data if qr_data.isdigit() else eval(qr_data).get('member_id')
                member = MemberProfile.query.filter_by(member_number=int(member_id)).first()
            else:
                # Try session QR format
                qr_dict = eval(qr_data)
                if qr_dict.get('type') == 'session_checkin':
                    # For session QR, we need member to identify themselves
                    # This would require member to be logged in
                    user_id = get_jwt_identity()
                    user = User.query.get(user_id)
                    if user.role != UserRole.MEMBER:
                        return jsonify({'error': 'Member login required'}), 403
                    member = MemberProfile.query.filter_by(user_id=user_id).first()
                else:
                    return jsonify({'error': 'Invalid QR code format'}), 400
        except:
            return jsonify({'error': 'Invalid QR code'}), 400
        
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        # Create attendance record
        attendance = Attendance(
            member_id=member.id,
            door=0,  # QR scan
            direction='entry',
            check_in_time=datetime.utcnow(),
            method='qr'
        )
        db.session.add(attendance)
        db.session.commit()
        
        # Send Pusher notification
        try:
            from services.pusher_service import PusherService
            from models import Package
            
            package_name = None
            if member.current_package_id:
                package = Package.query.get(member.current_package_id)
                if package:
                    package_name = package.name
            
            member_data = {
                'id': member.id,
                'member_number': member.member_number,
                'full_name': member.full_name,
                'card_id': member.card_id,
                'profile_picture': member.profile_picture,
                'phone': member.phone,
                'package_name': package_name,
                'check_in_time': datetime.utcnow().isoformat() + 'Z',
                'door': 0
            }
            
            PusherService.send_member_checkin(member_data)
        except Exception as pusher_error:
            current_app.logger.error(f"Failed to send Pusher notification: {str(pusher_error)}")
        
        return jsonify({
            'success': True,
            'member_name': member.full_name,
            'member_id': member.member_number,
            'message': 'Check-in successful',
            'time': datetime.utcnow().isoformat() + 'Z'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing QR check-in: {str(e)}")
        return jsonify({'error': 'Failed to process check-in'}), 500


@attendance_bp.route('/check-in-session', methods=['POST'])
@jwt_required()
def check_in_session():
    """
    Process manual session ID check-in.
    Member enters the session ID displayed on the QR scanner screen.
    
    Expected JSON:
    {
        "session_id": "abc123xyz"
    }
    
    Returns:
    {
        "success": true,
        "member_name": "John Doe",
        "message": "Check-in successful"
    }
    """
    try:
        from models import Transaction, TransactionStatus
        
        data = request.get_json()
        session_id = data.get('session_id')
        
        current_app.logger.info(f"Check-in session request: session_id={session_id}")
        
        if not session_id:
            return jsonify({'error': 'Session ID required'}), 400
        
        # Get current logged-in member
        user_id = get_jwt_identity()
        current_app.logger.info(f"User ID from JWT: {user_id}")
        
        user = User.query.get(user_id)
        
        if not user:
            current_app.logger.error(f"User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        current_app.logger.info(f"User role: {user.role}, Type: {type(user.role)}")
        current_app.logger.info(f"UserRole.MEMBER: {UserRole.MEMBER}, Type: {type(UserRole.MEMBER)}")
        current_app.logger.info(f"Comparison result: {user.role == UserRole.MEMBER}")
        
        # Check if user is a member
        if user.role != UserRole.MEMBER:
            current_app.logger.error(f"User is not a member. Role: {user.role}")
            return jsonify({'error': 'Member login required'}), 403
        
        member = MemberProfile.query.filter_by(user_id=user_id).first()
        
        if not member:
            current_app.logger.error(f"Member profile not found for user: {user_id}")
            return jsonify({'error': 'Member profile not found'}), 404
        
        current_app.logger.info(f"Member found: {member.full_name}")
        
        # Calculate member status and days remaining/overdue
        status = 'inactive'
        days_info = None
        now = datetime.utcnow()
        
        # Get grace period from settings
        from models import Settings
        settings = Settings.query.first()
        grace_period_days = settings.grace_period_days if settings else 3
        
        # Check if member has an active package with valid expiry date
        if member.package_expiry_date:
            if member.package_expiry_date > now:
                # Package is still valid - check for overdue payments
                overdue_transactions = Transaction.query.filter(
                    and_(
                        Transaction.member_id == member.id,
                        Transaction.status == TransactionStatus.PENDING,
                        Transaction.due_date < now - timedelta(days=grace_period_days)
                    )
                ).all()
                
                if overdue_transactions:
                    status = 'overdue'
                    # Calculate days overdue from oldest transaction
                    oldest_due_date = min(t.due_date for t in overdue_transactions)
                    days_overdue = (now - oldest_due_date).days - grace_period_days
                    days_info = {
                        'type': 'overdue',
                        'days': days_overdue,
                        'grace_period': grace_period_days
                    }
                else:
                    status = 'active'
                    # Calculate days remaining
                    days_remaining = (member.package_expiry_date - now).days
                    days_info = {
                        'type': 'remaining',
                        'days': days_remaining
                    }
            else:
                # Package expired
                status = 'inactive'
                days_overdue = (now - member.package_expiry_date).days
                days_info = {
                    'type': 'expired',
                    'days': days_overdue
                }
        else:
            # No package_expiry_date - check transactions to determine status
            # Get the most recent COMPLETED transaction
            recent_completed = Transaction.query.filter(
                and_(
                    Transaction.member_id == member.id,
                    Transaction.status == TransactionStatus.COMPLETED
                )
            ).order_by(Transaction.paid_date.desc()).first()
            
            if recent_completed and recent_completed.paid_date:
                # Member has paid - allow check-in even without expiry date
                # This handles legacy data where expiry dates weren't set
                status = 'active'
                days_info = {
                    'type': 'no_expiry_date',
                    'message': 'Package active (expiry date not set)',
                    'last_payment': recent_completed.paid_date.isoformat() + 'Z'
                }
                current_app.logger.info(f"Member has completed payment but no expiry date - allowing check-in")
            else:
                # Check if member has any transactions at all
                any_transaction = Transaction.query.filter_by(member_id=member.id).first()
                if not any_transaction:
                    # New member with no transactions - allow check-in
                    status = 'active'
                    days_info = {
                        'type': 'new_member',
                        'message': 'No package assigned yet'
                    }
                else:
                    # Has transactions but none completed and no expiry date
                    # Check for pending transactions
                    pending_transactions = Transaction.query.filter(
                        and_(
                            Transaction.member_id == member.id,
                            Transaction.status == TransactionStatus.PENDING
                        )
                    ).all()
                    
                    if pending_transactions:
                        # Has pending payments - check if overdue
                        overdue_pending = [t for t in pending_transactions if t.due_date and t.due_date < now - timedelta(days=grace_period_days)]
                        if overdue_pending:
                            status = 'overdue'
                            oldest_due_date = min(t.due_date for t in overdue_pending)
                            days_overdue = (now - oldest_due_date).days - grace_period_days
                            days_info = {
                                'type': 'overdue',
                                'days': days_overdue,
                                'grace_period': grace_period_days
                            }
                        else:
                            # Pending but within grace period - allow check-in
                            status = 'active'
                            days_info = {
                                'type': 'pending_within_grace',
                                'message': 'Payment pending but within grace period'
                            }
                    else:
                        # No completed or pending transactions - inactive
                        status = 'inactive'
                        days_info = {
                            'type': 'no_active_package',
                            'message': 'No active package found'
                        }
        
        current_app.logger.info(f"Member status: {status}, Days info: {days_info}")
        
        # Block check-in for inactive or overdue members
        if status in ['inactive', 'overdue']:
            current_app.logger.warning(f"Check-in denied for {member.full_name} - Status: {status}")
            return jsonify({
                'error': 'Please clear your dues' if status == 'overdue' else 'Package expired. Please renew your membership',
                'status': status,
                'days_info': days_info
            }), 403
        
        # Note: In a production system, you would validate the session_id
        # against stored sessions (e.g., in Redis with expiry)
        # For now, we'll accept any session_id and create the attendance record
        
        # Check for duplicate check-in (within last 5 minutes)
        five_minutes_ago = now - timedelta(minutes=5)
        recent_checkin = Attendance.query.filter(
            and_(
                Attendance.member_id == member.id,
                Attendance.check_in_time >= five_minutes_ago
            )
        ).first()
        
        if recent_checkin:
            return jsonify({'error': 'You already checked in recently'}), 400
        
        # Create attendance record
        attendance = Attendance(
            member_id=member.id,
            door=0,  # Manual session ID
            direction='entry',
            check_in_time=now,
            method='session_id'
        )
        db.session.add(attendance)
        
        # Create gate command for automatic gate opening
        from models import GateCommand
        gate_command = GateCommand(
            member_id=member.id,
            door=1,  # Default door 1
            status='pending',
            triggered_by='qr'
        )
        db.session.add(gate_command)
        
        db.session.commit()
        
        current_app.logger.info(f"Attendance record created for member: {member.full_name}")
        current_app.logger.info(f"Gate command created: {gate_command.id} for door 1")
        
        # Send Pusher notification
        try:
            from services.pusher_service import PusherService
            from models import Package
            
            package_name = None
            if member.current_package_id:
                package = Package.query.get(member.current_package_id)
                if package:
                    package_name = package.name
            
            member_data = {
                'id': member.id,
                'member_number': member.member_number,
                'full_name': member.full_name,
                'profile_picture': member.profile_picture,
                'phone': member.phone,
                'package_name': package_name,
                'check_in_time': now.isoformat() + 'Z',
                'door': 0,
                'status': status,
                'days_info': days_info
            }
            
            PusherService.send_member_checkin(member_data)
            current_app.logger.info(f"Pusher notification sent for member: {member.full_name}")
        except Exception as pusher_error:
            current_app.logger.error(f"Failed to send Pusher notification: {str(pusher_error)}")
        
        return jsonify({
            'success': True,
            'member_name': member.full_name,
            'member_id': member.member_number,
            'message': f'Welcome {member.full_name.split()[0]}! Check-in successful',
            'time': now.isoformat() + 'Z',
            'status': status,
            'days_info': days_info,
            'gate_command_id': gate_command.id  # Return gate command ID for status polling
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing session check-in: {str(e)}", exc_info=True)
        return jsonify({'error': f'Failed to process check-in: {str(e)}'}), 500

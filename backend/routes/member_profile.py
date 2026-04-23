"""Member profile routes with QR code check-in."""
from flask import Blueprint, request, jsonify, render_template_string, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, MemberProfile, Attendance, Transaction, Package
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import qrcode
import io
import base64

member_profile_bp = Blueprint('member_profile', __name__)


def get_serializer():
    """Get URL-safe timed serializer for token signing."""
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])


def generate_qr_code(data):
    """Generate QR code and return as base64 encoded image."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"


@member_profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_member_profile():
    """Get member profile with QR code for check-in."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get member profile
        member = MemberProfile.query.filter_by(user_id=user_id).first()
        
        if not member:
            return jsonify({'error': 'Member profile not found'}), 404
        
        # Generate signed token for QR code (expires in 24 hours)
        serializer = get_serializer()
        token = serializer.dumps({'member_id': member.id}, salt='qr-checkin')
        
        # Generate QR code URL
        base_url = current_app.config.get('FRONTEND_URL', request.host_url.rstrip('/'))
        qr_url = f"{base_url}/attendance/qr-checkin?token={token}"
        
        # Generate QR code image
        qr_code_image = generate_qr_code(qr_url)
        
        # Get membership status
        membership_status = 'active'
        days_remaining = None
        
        if member.package_expiry_date:
            days_remaining = (member.package_expiry_date - datetime.utcnow()).days
            if days_remaining < 0:
                membership_status = 'expired'
            elif days_remaining <= 3:
                membership_status = 'expiring_soon'
        
        # Get package details
        package = None
        if member.current_package_id:
            pkg = Package.query.get(member.current_package_id)
            if pkg:
                package = {
                    'name': pkg.name,
                    'duration_days': pkg.duration_days,
                    'price': float(pkg.price)
                }
        
        # Get last 10 attendance records
        recent_attendance = Attendance.query.filter_by(
            member_id=member.id
        ).order_by(Attendance.check_in_time.desc()).limit(10).all()
        
        attendance_records = [{
            'check_in_time': record.check_in_time.isoformat() + 'Z',
            'door': record.door,
            'direction': record.direction,
            'method': record.method
        } for record in recent_attendance]
        
        # Get payment status (last transaction)
        last_transaction = Transaction.query.filter_by(
            member_id=member.id
        ).order_by(Transaction.created_at.desc()).first()
        
        payment_status = 'no_payments'
        if last_transaction:
            if last_transaction.status == 'COMPLETED':
                payment_status = 'paid'
            elif last_transaction.status == 'PENDING':
                # Check if overdue (past grace period)
                if last_transaction.due_date:
                    grace_end = last_transaction.due_date + timedelta(days=3)
                    if datetime.utcnow().date() > grace_end.date():
                        payment_status = 'overdue'
                    else:
                        payment_status = 'pending'
        
        return jsonify({
            'member': {
                'id': member.id,
                'member_number': member.member_number,
                'full_name': member.full_name,
                'email': member.email,
                'phone': member.phone,
                'profile_picture': member.profile_picture,
                'admission_date': member.admission_date.isoformat() if member.admission_date else None,
                'package_start_date': member.package_start_date.isoformat() + 'Z' if member.package_start_date else None,
                'package_expiry_date': member.package_expiry_date.isoformat() + 'Z' if member.package_expiry_date else None,
                'is_frozen': member.is_frozen,
            },
            'membership_status': membership_status,
            'days_remaining': days_remaining,
            'package': package,
            'qr_code': qr_code_image,
            'qr_url': qr_url,
            'recent_attendance': attendance_records,
            'payment_status': payment_status
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching member profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@member_profile_bp.route('/qr-checkin', methods=['GET', 'POST'])
def qr_checkin():
    """
    QR code check-in endpoint.
    GET: Display check-in form (for staff tablet)
    POST: Process check-in
    """
    try:
        token = request.args.get('token') or request.form.get('token')
        
        if not token:
            return render_template_string(ERROR_TEMPLATE, 
                error="Invalid QR code - no token provided"), 400
        
        # Verify token (24 hour expiry)
        serializer = get_serializer()
        try:
            data = serializer.loads(token, salt='qr-checkin', max_age=86400)
            member_id = data.get('member_id')
        except SignatureExpired:
            return render_template_string(ERROR_TEMPLATE, 
                error="QR code expired - please generate a new one"), 400
        except BadSignature:
            return render_template_string(ERROR_TEMPLATE, 
                error="Invalid QR code"), 400
        
        # Get member
        member = MemberProfile.query.get(member_id)
        if not member:
            return render_template_string(ERROR_TEMPLATE, 
                error="Member not found"), 404
        
        # Check if member is frozen
        if member.is_frozen:
            return render_template_string(ERROR_TEMPLATE, 
                error=f"Member {member.full_name} is frozen - cannot check in"), 403
        
        # For GET request, show confirmation page
        if request.method == 'GET':
            return render_template_string(CHECKIN_FORM_TEMPLATE, 
                member=member, token=token)
        
        # For POST request, process check-in
        # Check for duplicate (within last 5 minutes)
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        recent_checkin = Attendance.query.filter(
            Attendance.member_id == member_id,
            Attendance.check_in_time >= five_minutes_ago
        ).first()
        
        if recent_checkin:
            return render_template_string(SUCCESS_TEMPLATE,
                member=member,
                check_in_time=recent_checkin.check_in_time,
                message="Already checked in recently")
        
        # Create attendance record
        attendance = Attendance(
            member_id=member_id,
            check_in_time=datetime.utcnow(),
            door=0,  # QR check-in has no door
            direction='entry',
            method='qr',
            synced_from_controller=False
        )
        db.session.add(attendance)
        db.session.commit()
        
        return render_template_string(SUCCESS_TEMPLATE,
            member=member,
            check_in_time=attendance.check_in_time,
            message="Check-in successful")
        
    except Exception as e:
        current_app.logger.error(f"Error processing QR check-in: {str(e)}")
        return render_template_string(ERROR_TEMPLATE, 
            error=f"System error: {str(e)}"), 500


# HTML Templates for QR check-in pages

CHECKIN_FORM_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Check-in - GOFIT</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 2px solid #F2C228;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(242, 194, 40, 0.3);
            text-align: center;
        }
        h1 {
            color: #F2C228;
            font-size: 32px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .subtitle {
            color: #fff;
            font-size: 14px;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .member-info {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(242, 194, 40, 0.2);
        }
        .member-name {
            color: #F2C228;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .member-id {
            color: #fff;
            font-size: 18px;
            opacity: 0.8;
        }
        .btn {
            background: linear-gradient(135deg, #F2C228 0%, #d4a91f 100%);
            color: #000;
            border: none;
            padding: 18px 50px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(242, 194, 40, 0.4);
            width: 100%;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(242, 194, 40, 0.6);
        }
        .btn:active {
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>GOFIT</h1>
        <p class="subtitle">Active Lifestyle</p>
        
        <div class="member-info">
            <div class="member-name">{{ member.full_name }}</div>
            <div class="member-id">Member #{{ member.member_number }}</div>
        </div>
        
        <form method="POST">
            <input type="hidden" name="token" value="{{ token }}">
            <button type="submit" class="btn">Check In Now</button>
        </form>
    </div>
</body>
</html>
"""

SUCCESS_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check-in Success - GOFIT</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 2px solid #10B981;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
            text-align: center;
            animation: slideIn 0.5s ease;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: #10B981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
            }
        }
        .checkmark {
            width: 40px;
            height: 40px;
            border: 4px solid #fff;
            border-top: none;
            border-right: none;
            transform: rotate(-45deg);
            margin-top: 10px;
        }
        h1 {
            color: #10B981;
            font-size: 32px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .message {
            color: #fff;
            font-size: 18px;
            margin-bottom: 30px;
        }
        .member-info {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .member-name {
            color: #F2C228;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .check-in-time {
            color: #fff;
            font-size: 16px;
            opacity: 0.8;
        }
        .note {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">
            <div class="checkmark"></div>
        </div>
        
        <h1>{{ message }}</h1>
        <p class="message">Welcome to GOFIT!</p>
        
        <div class="member-info">
            <div class="member-name">{{ member.full_name }}</div>
            <div class="check-in-time">
                Checked in at {{ check_in_time.strftime('%I:%M %p') }}
            </div>
        </div>
        
        <p class="note">This window will close automatically in 5 seconds</p>
    </div>
    
    <script>
        setTimeout(() => {
            window.close();
        }, 5000);
    </script>
</body>
</html>
"""

ERROR_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Check-in Error - GOFIT</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 2px solid #EF4444;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
            text-align: center;
        }
        .error-icon {
            width: 80px;
            height: 80px;
            background: #EF4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 48px;
            color: #fff;
            font-weight: bold;
        }
        h1 {
            color: #EF4444;
            font-size: 28px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .error-message {
            color: #fff;
            font-size: 18px;
            line-height: 1.6;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">!</div>
        <h1>Check-in Failed</h1>
        <div class="error-message">{{ error }}</div>
    </div>
</body>
</html>
"""

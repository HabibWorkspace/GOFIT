"""WebSocket service for real-time notifications using Flask-SocketIO."""

from flask_socketio import emit
from flask import current_app
from datetime import datetime, date


class WebSocketService:
    """Service for sending real-time notifications via WebSocket."""
    
    @staticmethod
    def send_member_checkin(member_data, socketio):
        """
        Send member check-in notification to all connected admin clients.
        
        Args:
            member_data (dict): Member information including name, photo, package, etc.
            socketio: Flask-SocketIO instance
        """
        try:
            # Emit to 'admin-notifications' room
            socketio.emit(
                'member-checkin',
                member_data,
                room='admin-notifications',
                namespace='/'
            )
            
            current_app.logger.info(f"WebSocket notification sent for member: {member_data.get('full_name')}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to send WebSocket notification: {str(e)}")
            return False
    
    @staticmethod
    def send_birthday_notification(birthday_members, socketio):
        """
        Send birthday notification to all connected admin clients.
        
        Args:
            birthday_members (list): List of members with birthdays today
            socketio: Flask-SocketIO instance
        """
        try:
            notification_data = {
                'type': 'birthday',
                'count': len(birthday_members),
                'members': birthday_members,
                'timestamp': datetime.now().isoformat()
            }
            
            # Emit to 'admin-notifications' room
            socketio.emit(
                'birthday-notification',
                notification_data,
                room='admin-notifications',
                namespace='/'
            )
            
            current_app.logger.info(f"Birthday notification sent for {len(birthday_members)} members")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to send birthday notification: {str(e)}")
            return False
    
    @staticmethod
    def send_system_alert(alert_data, socketio):
        """
        Send system alert to all connected admin clients.
        
        Args:
            alert_data (dict): Alert information
            socketio: Flask-SocketIO instance
        """
        try:
            socketio.emit(
                'system-alert',
                alert_data,
                room='admin-notifications',
                namespace='/'
            )
            
            current_app.logger.info(f"System alert sent: {alert_data.get('message')}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to send system alert: {str(e)}")
            return False
    
    @staticmethod
    def get_todays_birthdays(db):
        """
        Get all members with birthdays today.
        
        Args:
            db: SQLAlchemy database instance
            
        Returns:
            list: List of member dictionaries with birthday information
        """
        try:
            from models.member_profile import MemberProfile
            from models import Package
            
            today = date.today()
            
            # Query members with birthday today (matching month and day)
            members = MemberProfile.query.filter(
                db.extract('month', MemberProfile.date_of_birth) == today.month,
                db.extract('day', MemberProfile.date_of_birth) == today.day
            ).all()
            
            birthday_members = []
            for member in members:
                # Calculate age
                age = today.year - member.date_of_birth.year
                
                # Get package name
                package_name = 'No Package'
                if member.current_package_id:
                    package = Package.query.get(member.current_package_id)
                    if package:
                        package_name = package.name
                
                birthday_members.append({
                    'id': member.id,
                    'card_id': member.card_id,
                    'member_number': member.member_number,
                    'full_name': member.full_name,
                    'age': age,
                    'phone': member.phone,
                    'profile_picture': member.profile_picture,
                    'package': package_name,
                    'date_of_birth': member.date_of_birth.isoformat()
                })
            
            return birthday_members
            
        except Exception as e:
            current_app.logger.error(f"Failed to get today's birthdays: {str(e)}")
            return []

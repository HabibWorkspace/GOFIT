"""WebSocket event handlers for real-time communication."""

from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from datetime import datetime


def register_socketio_events(socketio, app):
    """Register all WebSocket event handlers."""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection."""
        try:
            # Get token from query params or headers
            token = request.args.get('token')
            
            if token:
                try:
                    # Decode JWT token to get user info
                    decoded = decode_token(token)
                    user_role = decoded.get('role', 'unknown')
                    user_id = decoded.get('sub', 'unknown')
                    
                    app.logger.info(f"WebSocket connected: User {user_id} (Role: {user_role})")
                    
                    # Join admin notifications room if user is admin/receptionist/super_admin
                    if user_role in ['ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN']:
                        join_room('admin-notifications')
                        app.logger.info(f"User {user_id} joined admin-notifications room")
                        
                        # Send connection confirmation
                        emit('connection-status', {
                            'status': 'connected',
                            'message': 'Real-time notifications enabled',
                            'timestamp': datetime.now().isoformat()
                        })
                        
                        # Check for birthdays and send notification
                        from services.websocket_service import WebSocketService
                        from database import db
                        
                        with app.app_context():
                            birthday_members = WebSocketService.get_todays_birthdays(db)
                            if birthday_members:
                                WebSocketService.send_birthday_notification(birthday_members, socketio)
                    
                except Exception as e:
                    app.logger.error(f"Failed to decode token: {str(e)}")
                    emit('connection-status', {
                        'status': 'error',
                        'message': 'Authentication failed'
                    })
            else:
                # Allow connection without token (for testing)
                app.logger.info("WebSocket connected without token")
                emit('connection-status', {
                    'status': 'connected',
                    'message': 'Connected (no authentication)'
                })
                
        except Exception as e:
            app.logger.error(f"Connection error: {str(e)}")
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection."""
        try:
            app.logger.info("WebSocket disconnected")
        except Exception as e:
            app.logger.error(f"Disconnect error: {str(e)}")
    
    @socketio.on('join-admin')
    def handle_join_admin(data):
        """Handle admin joining notifications room."""
        try:
            join_room('admin-notifications')
            app.logger.info("Client joined admin-notifications room")
            
            emit('room-joined', {
                'room': 'admin-notifications',
                'message': 'Successfully joined admin notifications',
                'timestamp': datetime.now().isoformat()
            })
            
            # Send today's birthdays on join
            from services.websocket_service import WebSocketService
            from database import db
            
            with app.app_context():
                birthday_members = WebSocketService.get_todays_birthdays(db)
                if birthday_members:
                    emit('birthday-notification', {
                        'type': 'birthday',
                        'count': len(birthday_members),
                        'members': birthday_members,
                        'timestamp': datetime.now().isoformat()
                    })
            
        except Exception as e:
            app.logger.error(f"Join admin room error: {str(e)}")
    
    @socketio.on('leave-admin')
    def handle_leave_admin(data):
        """Handle admin leaving notifications room."""
        try:
            leave_room('admin-notifications')
            app.logger.info("Client left admin-notifications room")
            
            emit('room-left', {
                'room': 'admin-notifications',
                'message': 'Left admin notifications'
            })
            
        except Exception as e:
            app.logger.error(f"Leave admin room error: {str(e)}")
    
    @socketio.on('ping')
    def handle_ping():
        """Handle ping for connection keep-alive."""
        emit('pong', {'timestamp': datetime.now().isoformat()})
    
    @socketio.on('request-birthdays')
    def handle_request_birthdays():
        """Handle request for today's birthdays."""
        try:
            from services.websocket_service import WebSocketService
            from database import db
            
            with app.app_context():
                birthday_members = WebSocketService.get_todays_birthdays(db)
                
                emit('birthday-notification', {
                    'type': 'birthday',
                    'count': len(birthday_members),
                    'members': birthday_members,
                    'timestamp': datetime.now().isoformat()
                })
                
        except Exception as e:
            app.logger.error(f"Request birthdays error: {str(e)}")
            emit('error', {'message': 'Failed to fetch birthdays'})

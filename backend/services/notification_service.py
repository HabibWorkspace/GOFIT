"""Notification service for emitting real-time attendance events via WebSocket."""
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for emitting real-time attendance notifications via Flask-SocketIO."""
    
    def __init__(self, socketio):
        """
        Initialize notification service with Flask-SocketIO instance.
        
        Args:
            socketio: Flask-SocketIO instance for emitting events
        """
        self.socketio = socketio
        logger.info("NotificationService initialized")
    
    def emit_check_in(self, person_name: str, person_type: str, 
                     check_in_time: datetime):
        """
        Emit check-in notification to all connected administrators.
        
        This method emits a 'attendance:checkin' event containing:
        - person_name: Name of the person who checked in
        - person_type: Type of person ('member' or 'trainer')
        - timestamp: ISO 8601 formatted check-in time
        - stay_duration: null (not applicable for check-in)
        
        Args:
            person_name: Name of the person checking in
            person_type: Type of person ('member' or 'trainer')
            check_in_time: Timestamp of the check-in event
        """
        try:
            # Format timestamp as ISO 8601
            # If timestamp already has timezone info (+00:00), don't add Z
            timestamp_str = check_in_time.isoformat()
            if timestamp_str.endswith('+00:00'):
                timestamp_str = timestamp_str[:-6] + 'Z'  # Replace +00:00 with Z
            elif not timestamp_str.endswith('Z'):
                timestamp_str += 'Z'
            
            # Prepare event payload
            payload = {
                'event_type': 'checkin',
                'person_name': person_name,
                'person_type': person_type,
                'check_in_time': timestamp_str,  # Use check_in_time for consistency
                'timestamp': timestamp_str,  # Keep for backward compatibility
                'stay_duration': None
            }
            
            # Emit to 'attendance:checkin' event
            self.socketio.emit('attendance:checkin', payload)
            
            logger.info(f"Emitted check-in notification for {person_type} {person_name} at {timestamp_str}")
            
        except Exception as e:
            logger.error(
                f"Failed to emit check-in notification: {str(e)}. "
                f"Error type: {type(e).__name__}",
                exc_info=True
            )
            # Don't raise - notification failures should not block attendance processing
    
    def emit_check_out(self, person_name: str, person_type: str,
                      check_in_time: datetime, stay_duration: int):
        """
        Emit check-out notification to all connected administrators.
        
        This method emits a 'attendance:checkout' event containing:
        - person_name: Name of the person who checked out
        - person_type: Type of person ('member' or 'trainer')
        - timestamp: ISO 8601 formatted check-in time (original check-in, not check-out)
        - stay_duration: Duration of stay in minutes
        
        Args:
            person_name: Name of the person checking out
            person_type: Type of person ('member' or 'trainer')
            check_in_time: Timestamp of the original check-in event
            stay_duration: Duration of stay in minutes
        """
        try:
            # Format timestamp as ISO 8601
            # If timestamp already has timezone info (+00:00), don't add Z
            timestamp_str = check_in_time.isoformat()
            if timestamp_str.endswith('+00:00'):
                timestamp_str = timestamp_str[:-6] + 'Z'  # Replace +00:00 with Z
            elif not timestamp_str.endswith('Z'):
                timestamp_str += 'Z'
            
            # Prepare event payload
            payload = {
                'event_type': 'checkout',
                'person_name': person_name,
                'person_type': person_type,
                'check_in_time': timestamp_str,  # Use check_in_time for consistency
                'timestamp': timestamp_str,  # Keep for backward compatibility
                'stay_duration': stay_duration
            }
            
            # Emit to 'attendance:checkout' event
            self.socketio.emit('attendance:checkout', payload)
            
            logger.info(f"Emitted check-out notification for {person_type} {person_name} "
                       f"at {timestamp_str}, stay_duration={stay_duration} minutes")
            
        except Exception as e:
            logger.error(
                f"Failed to emit check-out notification: {str(e)}. "
                f"Error type: {type(e).__name__}",
                exc_info=True
            )
            # Don't raise - notification failures should not block attendance processing

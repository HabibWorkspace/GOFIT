"""Pusher service for real-time notifications."""
import os
import pusher
from flask import current_app

class PusherService:
    """Service for sending real-time notifications via Pusher."""
    
    _pusher_client = None
    
    @classmethod
    def get_client(cls):
        """Get or create Pusher client instance."""
        if cls._pusher_client is None:
            cls._pusher_client = pusher.Pusher(
                app_id=os.getenv('PUSHER_APP_ID', ''),
                key=os.getenv('PUSHER_KEY', ''),
                secret=os.getenv('PUSHER_SECRET', ''),
                cluster=os.getenv('PUSHER_CLUSTER', 'ap2'),
                ssl=True
            )
        return cls._pusher_client
    
    @classmethod
    def send_member_checkin(cls, member_data):
        """
        Send member check-in notification to admin dashboard.
        
        Args:
            member_data (dict): Member information including:
                - id: Member ID
                - full_name: Member name
                - member_number: Member number
                - card_id: RFID card ID
                - profile_picture: Profile picture URL
                - check_in_time: Check-in timestamp
                - package_name: Current package name
        """
        try:
            client = cls.get_client()
            
            # Trigger event on 'admin-notifications' channel
            client.trigger(
                'admin-notifications',
                'member-checkin',
                member_data
            )
            
            current_app.logger.info(f"Pusher notification sent for member: {member_data.get('full_name')}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to send Pusher notification: {str(e)}")
            return False
    
    @classmethod
    def send_overdue_payment_alert(cls, member_data):
        """
        Send overdue payment alert to admin dashboard.
        
        Args:
            member_data (dict): Member information with payment details
        """
        try:
            client = cls.get_client()
            
            client.trigger(
                'admin-notifications',
                'overdue-payment',
                member_data
            )
            
            current_app.logger.info(f"Overdue payment alert sent for member: {member_data.get('full_name')}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to send overdue payment alert: {str(e)}")
            return False

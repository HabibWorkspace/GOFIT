"""Sync state model to track last processed attendance log."""
from database import db
from datetime import datetime
import uuid


class SyncState(db.Model):
    """Track the last processed attendance log timestamp per device user."""
    __tablename__ = 'sync_state'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_user_id = db.Column(db.String(50), nullable=False, unique=True, index=True)
    last_processed_timestamp = db.Column(db.DateTime, nullable=False)
    device_serial = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<SyncState {self.device_user_id} - {self.last_processed_timestamp}>'
    
    def to_dict(self):
        """Convert sync state to dictionary."""
        return {
            'id': self.id,
            'device_user_id': self.device_user_id,
            'last_processed_timestamp': self.last_processed_timestamp.isoformat() + 'Z',
            'device_serial': self.device_serial,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z'
        }

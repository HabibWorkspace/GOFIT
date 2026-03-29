"""Device user mapping model."""
from database import db
from datetime import datetime
import uuid


class DeviceUserMapping(db.Model):
    """Device user mapping model for linking biometric device users to gym members/trainers."""
    __tablename__ = 'device_user_mappings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_user_id = db.Column(db.String(50), nullable=False, unique=True, index=True)
    person_type = db.Column(db.String(10), nullable=False)  # 'member' or 'trainer'
    person_id = db.Column(db.String(36), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('person_type', 'person_id', name='uq_person'),
    )
    
    def __repr__(self):
        return f'<DeviceUserMapping {self.device_user_id} -> {self.person_type} {self.person_id}>'
    
    def to_dict(self):
        """Convert device user mapping to dictionary."""
        return {
            'id': self.id,
            'device_user_id': self.device_user_id,
            'person_type': self.person_type,
            'person_id': self.person_id,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z'
        }

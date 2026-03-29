"""Attendance record model."""
from database import db
from datetime import datetime
import uuid


class AttendanceRecord(db.Model):
    """Attendance record model for biometric attendance tracking."""
    __tablename__ = 'attendance_records'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_user_id = db.Column(db.String(50), nullable=False, index=True)
    person_type = db.Column(db.String(10), nullable=False, index=True)  # 'member' or 'trainer'
    person_id = db.Column(db.String(36), nullable=False, index=True)
    person_name = db.Column(db.String(100), nullable=True)  # Actual name of the person
    check_in_time = db.Column(db.DateTime, nullable=False, index=True)
    check_out_time = db.Column(db.DateTime, nullable=True)
    stay_duration = db.Column(db.Integer, nullable=True)  # Minutes
    device_serial = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<AttendanceRecord {self.id} - {self.person_type} {self.person_name or self.person_id}>'
    
    def to_dict(self):
        """Convert attendance record to dictionary."""
        return {
            'id': self.id,
            'device_user_id': self.device_user_id,
            'person_type': self.person_type,
            'person_id': self.person_id,
            'person_name': self.person_name,
            'check_in_time': self.check_in_time.isoformat() + 'Z',
            'check_out_time': self.check_out_time.isoformat() + 'Z' if self.check_out_time else None,
            'stay_duration': self.stay_duration,
            'device_serial': self.device_serial,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z'
        }

"""Daily attendance summary model."""
from database import db
from datetime import datetime
import uuid


class DailyAttendanceSummary(db.Model):
    """Daily attendance summary - one record per person per day."""
    __tablename__ = 'daily_attendance_summary'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    date = db.Column(db.Date, nullable=False, index=True)
    person_id = db.Column(db.String(36), nullable=False, index=True)
    person_name = db.Column(db.String(100), nullable=True)
    person_type = db.Column(db.String(10), nullable=False)  # 'member' or 'trainer'
    status = db.Column(db.String(10), nullable=False, default='Present')  # 'Present' or 'Absent'
    first_check_in = db.Column(db.DateTime, nullable=True)
    last_check_out = db.Column(db.DateTime, nullable=True)
    total_time_minutes = db.Column(db.Integer, nullable=True)  # Total time spent in minutes
    visit_count = db.Column(db.Integer, default=1)  # Number of check-ins in the day
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint: one record per person per day
    __table_args__ = (
        db.UniqueConstraint('date', 'person_id', name='unique_person_date'),
    )
    
    def __repr__(self):
        return f'<DailyAttendanceSummary {self.date} - {self.person_name} ({self.status})>'
    
    def to_dict(self):
        """Convert daily attendance summary to dictionary."""
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'person_id': self.person_id,
            'person_name': self.person_name,
            'person_type': self.person_type,
            'status': self.status,
            'first_check_in': self.first_check_in.isoformat() + 'Z' if self.first_check_in else None,
            'last_check_out': self.last_check_out.isoformat() + 'Z' if self.last_check_out else None,
            'total_time_minutes': self.total_time_minutes,
            'visit_count': self.visit_count,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z'
        }

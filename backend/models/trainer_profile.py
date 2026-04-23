"""Trainer profile model."""
from database import db
from datetime import datetime
import uuid


class TrainerProfile(db.Model):
    """Trainer profile model."""
    __tablename__ = 'trainer_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    full_name = db.Column(db.String(100), nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    cnic = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    specialization = db.Column(db.String(100), nullable=False)
    salary_rate = db.Column(db.Numeric(10, 2), nullable=False)
    hire_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    availability = db.Column(db.Text, nullable=True)  # JSON string storing weekly schedule
    
    # Commission fields
    monthly_charge = db.Column(db.Numeric(10, 2), default=0, nullable=False)  # Total charge billed to member
    gym_commission_percent = db.Column(db.Numeric(5, 2), default=50.00, nullable=False)  # Gym's cut percentage
    trainer_commission_percent = db.Column(db.Numeric(5, 2), default=50.00, nullable=False)  # Trainer's cut percentage
    bank_account = db.Column(db.String(100), nullable=True)  # Bank account for payments
    joining_date = db.Column(db.Date, nullable=True)  # Official joining date
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - Admin management only (no portal-specific relationships)
    
    def __repr__(self):
        return f'<TrainerProfile {self.user_id}>'
    
    def to_dict(self):
        """Convert trainer profile to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'phone': self.phone,
            'cnic': self.cnic,
            'email': self.email,
            'specialization': self.specialization,
            'salary_rate': float(self.salary_rate),
            'hire_date': self.hire_date.isoformat(),
            'availability': self.availability,
            'monthly_charge': float(self.monthly_charge),
            'gym_commission_percent': float(self.gym_commission_percent),
            'trainer_commission_percent': float(self.trainer_commission_percent),
            'bank_account': self.bank_account,
            'joining_date': self.joining_date.isoformat() if self.joining_date else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

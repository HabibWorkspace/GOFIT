"""Trainer commission models for tracking trainer earnings and payments."""
from database import db
from datetime import datetime
import uuid
from enum import Enum


class PaymentStatus(Enum):
    """Payment status enumeration."""
    PENDING = 'pending'
    PARTIAL = 'partial'
    PAID = 'paid'


class TrainerMemberCharge(db.Model):
    """Links trainer charges to specific members for commission tracking."""
    __tablename__ = 'trainer_member_charges'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trainer_id = db.Column(db.String(36), db.ForeignKey('trainer_profiles.id'), nullable=False, index=True)
    member_id = db.Column(db.String(36), db.ForeignKey('member_profiles.id'), nullable=False, index=True)
    monthly_charge = db.Column(db.Numeric(10, 2), nullable=False)
    gym_cut = db.Column(db.Numeric(10, 2), nullable=False)  # Computed: monthly_charge * gym_commission_percent / 100
    trainer_cut = db.Column(db.Numeric(10, 2), nullable=False)  # Computed: monthly_charge * trainer_commission_percent / 100
    month_year = db.Column(db.Date, nullable=False, index=True)  # First day of billing month
    payment_status = db.Column(db.Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    amount_paid_by_member = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    trainer_paid = db.Column(db.Boolean, default=False, nullable=False)
    trainer_paid_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    trainer = db.relationship('TrainerProfile', backref='member_charges')
    member = db.relationship('MemberProfile', backref='trainer_charges')
    
    def __repr__(self):
        return f'<TrainerMemberCharge {self.trainer_id} - {self.member_id} - {self.month_year}>'
    
    def to_dict(self):
        """Convert trainer member charge to dictionary."""
        return {
            'id': self.id,
            'trainer_id': self.trainer_id,
            'member_id': self.member_id,
            'monthly_charge': float(self.monthly_charge),
            'gym_cut': float(self.gym_cut),
            'trainer_cut': float(self.trainer_cut),
            'month_year': self.month_year.isoformat() if self.month_year else None,
            'payment_status': self.payment_status.value,
            'amount_paid_by_member': float(self.amount_paid_by_member),
            'trainer_paid': self.trainer_paid,
            'trainer_paid_date': self.trainer_paid_date.isoformat() if self.trainer_paid_date else None,
            'created_at': self.created_at.isoformat() + 'Z',
        }


class TrainerSalarySlip(db.Model):
    """Monthly salary slip for trainers."""
    __tablename__ = 'trainer_salary_slips'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trainer_id = db.Column(db.String(36), db.ForeignKey('trainer_profiles.id'), nullable=False, index=True)
    month_year = db.Column(db.Date, nullable=False, index=True)  # First day of the month
    total_members_billed = db.Column(db.Integer, default=0, nullable=False)
    total_charges = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    gym_total_cut = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    trainer_total_cut = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    amount_paid = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    payment_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    generated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    trainer = db.relationship('TrainerProfile', backref='salary_slips')
    generated_by_user = db.relationship('User', backref='generated_salary_slips')
    
    def __repr__(self):
        return f'<TrainerSalarySlip {self.trainer_id} - {self.month_year}>'
    
    def to_dict(self):
        """Convert trainer salary slip to dictionary."""
        return {
            'id': self.id,
            'trainer_id': self.trainer_id,
            'month_year': self.month_year.isoformat() if self.month_year else None,
            'total_members_billed': self.total_members_billed,
            'total_charges': float(self.total_charges),
            'gym_total_cut': float(self.gym_total_cut),
            'trainer_total_cut': float(self.trainer_total_cut),
            'amount_paid': float(self.amount_paid),
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'notes': self.notes,
            'generated_at': self.generated_at.isoformat() + 'Z',
            'generated_by': self.generated_by,
        }

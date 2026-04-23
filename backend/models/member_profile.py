"""Member profile model."""
from database import db
from datetime import datetime
import uuid


class MemberProfile(db.Model):
    """Member profile model."""
    __tablename__ = 'member_profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    member_number = db.Column(db.Integer, unique=True, nullable=True)
    card_id = db.Column(db.String(20), unique=True, nullable=True, index=True)  # RFID card number
    full_name = db.Column(db.String(100), nullable=False, default='')
    phone = db.Column(db.String(20), unique=False, nullable=True, index=True)
    cnic = db.Column(db.String(20), unique=False, nullable=True, index=True)
    email = db.Column(db.String(100), unique=False, nullable=True, index=False)  # Removed unique constraint
    gender = db.Column(db.String(10))
    date_of_birth = db.Column(db.Date)
    father_name = db.Column(db.String(100), nullable=True)
    weight_kg = db.Column(db.Numeric(5, 2), nullable=True)  # Weight in kilograms (e.g., 75.50)
    blood_group = db.Column(db.String(10), nullable=True)  # e.g., A+, B-, O+, AB+
    address = db.Column(db.Text, nullable=True)
    admission_date = db.Column(db.Date)
    admission_fee_paid = db.Column(db.Boolean, default=False, nullable=False)
    current_package_id = db.Column(db.String(36), db.ForeignKey('packages.id'))
    trainer_id = db.Column(db.String(36), db.ForeignKey('trainer_profiles.id'))
    package_start_date = db.Column(db.DateTime)
    package_expiry_date = db.Column(db.DateTime)
    is_frozen = db.Column(db.Boolean, default=False, nullable=False)
    profile_picture = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - Admin management only (keep transactions for finance)
    transactions = db.relationship('Transaction', backref='member', cascade='all, delete-orphan')
    trainer = db.relationship('TrainerProfile', foreign_keys=[trainer_id], backref='assigned_members')
    
    def __repr__(self):
        return f'<MemberProfile {self.user_id}>'
    
    def to_dict(self):
        """Convert member profile to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'member_number': self.member_number,
            'card_id': self.card_id,
            'full_name': self.full_name,
            'phone': self.phone,
            'cnic': self.cnic,
            'email': self.email,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'father_name': self.father_name,
            'weight_kg': float(self.weight_kg) if self.weight_kg else None,
            'blood_group': self.blood_group,
            'address': self.address,
            'admission_date': self.admission_date.isoformat() if self.admission_date else None,
            'admission_fee_paid': self.admission_fee_paid,
            'current_package_id': self.current_package_id,
            'trainer_id': self.trainer_id,
            'package_start_date': self.package_start_date.isoformat() + 'Z' if self.package_start_date else None,
            'package_expiry_date': self.package_expiry_date.isoformat() + 'Z' if self.package_expiry_date else None,
            'is_frozen': self.is_frozen,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z',
        }

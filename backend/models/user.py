"""User model."""
from database import db
from datetime import datetime
import uuid
from enum import Enum


class UserRole(Enum):
    """User role enumeration."""
    SUPER_ADMIN = 'super_admin'  # Gym owner with full access
    ADMIN = 'admin'  # Receptionist with limited access (legacy, will be migrated to RECEPTIONIST)
    RECEPTIONIST = 'receptionist'  # Front desk staff with limited access
    TRAINER = 'trainer'
    MEMBER = 'member'
    SCANNER = 'scanner'  # QR Scanner role for front desk


class User(db.Model):
    """User model for authentication."""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=True)  # Plain password for display
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.MEMBER)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships - Admin management only
    member_profile = db.relationship('MemberProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    trainer_profile = db.relationship('TrainerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role.value,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z',
        }

"""Gate command model for remote turnstile control."""
from database import db
from datetime import datetime
import uuid


class GateCommand(db.Model):
    """Gate command model for queuing remote gate open commands."""
    __tablename__ = 'gate_commands'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = db.Column(db.String(36), db.ForeignKey('member_profiles.id'), nullable=True, index=True)
    door = db.Column(db.Integer, nullable=False, default=1)  # 1 or 2
    status = db.Column(db.String(20), nullable=False, default='pending', index=True)
    # Status values: 'pending', 'executed', 'failed', 'expired'
    triggered_by = db.Column(db.String(20), nullable=False)  # 'qr', 'manual', 'card'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    executed_at = db.Column(db.DateTime, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    
    # Relationship
    member = db.relationship('MemberProfile', backref='gate_commands')
    
    def __repr__(self):
        return f'<GateCommand {self.id} door={self.door} status={self.status}>'
    
    def to_dict(self):
        """Convert gate command to dictionary."""
        return {
            'id': self.id,
            'member_id': self.member_id,
            'door': self.door,
            'status': self.status,
            'triggered_by': self.triggered_by,
            'created_at': self.created_at.isoformat() + 'Z',
            'executed_at': self.executed_at.isoformat() + 'Z' if self.executed_at else None,
            'error_message': self.error_message,
        }

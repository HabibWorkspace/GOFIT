"""Attendance models for RFID card-based check-in system."""
from database import db
from datetime import datetime
import uuid


class Attendance(db.Model):
    """Attendance records from turnstile controller."""
    __tablename__ = 'attendance'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = db.Column(db.String(36), db.ForeignKey('member_profiles.id'), nullable=False, index=True)
    check_in_time = db.Column(db.DateTime, nullable=False, index=True)
    door = db.Column(db.Integer, nullable=False)  # 1 or 2
    direction = db.Column(db.String(10), nullable=False)  # 'entry' or 'exit'
    method = db.Column(db.String(20), nullable=False, default='card')  # 'card', 'qr', or 'manual'
    synced_from_controller = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    member = db.relationship('MemberProfile', backref='attendance_records')
    
    def __repr__(self):
        return f'<Attendance {self.member_id} at {self.check_in_time}>'
    
    def to_dict(self):
        """Convert attendance record to dictionary."""
        return {
            'id': self.id,
            'member_id': self.member_id,
            'check_in_time': self.check_in_time.isoformat() + 'Z',
            'door': self.door,
            'direction': self.direction,
            'method': self.method,
            'synced_from_controller': self.synced_from_controller,
            'created_at': self.created_at.isoformat() + 'Z',
        }


class BridgeHeartbeat(db.Model):
    """Tracks the bridge script status on front desk PC."""
    __tablename__ = 'bridge_heartbeat'
    
    id = db.Column(db.Integer, primary_key=True)
    last_seen = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    pc_ip = db.Column(db.String(20), nullable=False)
    records_synced_today = db.Column(db.Integer, default=0, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<BridgeHeartbeat {self.pc_ip} at {self.last_seen}>'
    
    def to_dict(self):
        """Convert heartbeat to dictionary."""
        return {
            'id': self.id,
            'last_seen': self.last_seen.isoformat() + 'Z',
            'pc_ip': self.pc_ip,
            'records_synced_today': self.records_synced_today,
            'updated_at': self.updated_at.isoformat() + 'Z',
        }


class UnknownCard(db.Model):
    """Logs unknown RFID cards that scanned but aren't assigned to any member."""
    __tablename__ = 'unknown_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.String(20), nullable=False, index=True)
    door = db.Column(db.Integer, nullable=False)
    direction = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    first_seen = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    scan_count = db.Column(db.Integer, default=1, nullable=False)
    
    def __repr__(self):
        return f'<UnknownCard {self.card_id}>'
    
    def to_dict(self):
        """Convert unknown card to dictionary."""
        return {
            'id': self.id,
            'card_id': self.card_id,
            'door': self.door,
            'direction': self.direction,
            'timestamp': self.timestamp.isoformat() + 'Z',
            'first_seen': self.first_seen.isoformat() + 'Z',
            'last_seen': self.last_seen.isoformat() + 'Z',
            'scan_count': self.scan_count,
        }

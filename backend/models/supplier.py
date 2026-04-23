"""Supplier model for supplement inventory."""
from database import db
from datetime import datetime
import uuid


class Supplier(db.Model):
    """Supplier model for supplement suppliers."""
    __tablename__ = 'suppliers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(100))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    supplements = db.relationship('Supplement', backref='supplier', lazy=True)
    
    def __repr__(self):
        return f'<Supplier {self.name}>'
    
    def to_dict(self):
        """Convert supplier to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'contact': self.contact,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

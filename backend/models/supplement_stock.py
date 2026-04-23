"""Supplement stock movement model."""
from database import db
from datetime import datetime
import uuid
import enum


class MovementType(enum.Enum):
    """Stock movement types."""
    PURCHASE = 'purchase'
    SALE = 'sale'
    ADJUSTMENT = 'adjustment'
    EXPIRED = 'expired'


class SupplementStock(db.Model):
    """Stock movement tracking for supplements."""
    __tablename__ = 'supplement_stock'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplement_id = db.Column(db.String(36), db.ForeignKey('supplements.id'), nullable=False)
    movement_type = db.Column(db.Enum(MovementType), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)  # Positive for stock in, negative for stock out
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)  # Purchase or sale price at time
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    reference_id = db.Column(db.String(36), nullable=True)  # Links to SupplementSale id if sale
    notes = db.Column(db.Text)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    creator = db.relationship('User', backref='supplement_stock_movements', foreign_keys=[created_by])
    
    def __repr__(self):
        return f'<SupplementStock {self.movement_type.value} - {self.quantity}>'
    
    def to_dict(self):
        """Convert stock movement to dictionary."""
        return {
            'id': self.id,
            'supplement_id': self.supplement_id,
            'supplement_name': self.supplement.name if self.supplement else None,
            'movement_type': self.movement_type.value,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_amount': float(self.total_amount),
            'reference_id': self.reference_id,
            'notes': self.notes,
            'created_by': self.created_by,
            'created_by_username': self.creator.username if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

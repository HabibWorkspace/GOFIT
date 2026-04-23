"""Supplement sale model."""
from database import db
from datetime import datetime
import uuid


class SupplementSale(db.Model):
    """Sales record for supplements."""
    __tablename__ = 'supplement_sales'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplement_id = db.Column(db.String(36), db.ForeignKey('supplements.id'), nullable=False)
    member_id = db.Column(db.String(36), db.ForeignKey('member_profiles.id'), nullable=True)  # Nullable for walk-in customers
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)  # Selling price at time of sale
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    profit = db.Column(db.Numeric(10, 2), nullable=False)  # (selling_price - purchase_price) * quantity
    payment_method = db.Column(db.String(20), default='cash')  # cash, card, etc.
    sold_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    sold_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    member = db.relationship('MemberProfile', backref='supplement_purchases', foreign_keys=[member_id])
    seller = db.relationship('User', backref='supplement_sales', foreign_keys=[sold_by])
    
    def __repr__(self):
        return f'<SupplementSale {self.supplement.name if self.supplement else "Unknown"} - {self.quantity}>'
    
    def to_dict(self):
        """Convert sale to dictionary."""
        return {
            'id': self.id,
            'supplement_id': self.supplement_id,
            'supplement_name': self.supplement.name if self.supplement else None,
            'supplement_brand': self.supplement.brand if self.supplement else None,
            'member_id': self.member_id,
            'member_name': self.member.full_name if self.member else 'Walk-in Customer',
            'member_number': self.member.member_number if self.member else None,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_amount': float(self.total_amount),
            'profit': float(self.profit),
            'payment_method': self.payment_method,
            'sold_by': self.sold_by,
            'sold_by_username': self.seller.username if self.seller else None,
            'sold_at': self.sold_at.isoformat() if self.sold_at else None,
        }

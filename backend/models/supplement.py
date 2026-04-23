"""Supplement model for inventory management."""
from database import db
from datetime import datetime, date
import uuid


class Supplement(db.Model):
    """Supplement model for gym supplement inventory."""
    __tablename__ = 'supplements'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    brand = db.Column(db.String(100))
    category = db.Column(db.String(50))  # Protein, Creatine, Vitamins, Pre-workout, etc.
    supplier_id = db.Column(db.String(36), db.ForeignKey('suppliers.id'), nullable=True)
    purchase_price = db.Column(db.Numeric(10, 2), nullable=False)  # Cost per unit from supplier
    selling_price = db.Column(db.Numeric(10, 2), nullable=False)  # Price charged to customer
    current_stock = db.Column(db.Integer, default=0, nullable=False)
    low_stock_threshold = db.Column(db.Integer, default=5, nullable=False)
    unit = db.Column(db.String(20), default='unit')  # kg, bottle, sachet, etc.
    expiry_date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    stock_movements = db.relationship('SupplementStock', backref='supplement', lazy=True, cascade='all, delete-orphan')
    sales = db.relationship('SupplementSale', backref='supplement', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Supplement {self.name} - {self.brand}>'
    
    @property
    def status(self):
        """Get supplement status based on stock and expiry."""
        today = date.today()
        
        # Check if expired
        if self.expiry_date and self.expiry_date < today:
            return 'expired'
        
        # Check if low stock
        if self.current_stock <= self.low_stock_threshold:
            return 'low_stock'
        
        # Check if expiring soon (within 30 days)
        if self.expiry_date and (self.expiry_date - today).days <= 30:
            return 'expiring_soon'
        
        return 'good'
    
    @property
    def profit_margin(self):
        """Calculate profit margin percentage."""
        if self.purchase_price and self.purchase_price > 0:
            profit = float(self.selling_price) - float(self.purchase_price)
            margin = (profit / float(self.purchase_price)) * 100
            return round(margin, 2)
        return 0
    
    def to_dict(self):
        """Convert supplement to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'brand': self.brand,
            'category': self.category,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'purchase_price': float(self.purchase_price),
            'selling_price': float(self.selling_price),
            'current_stock': self.current_stock,
            'low_stock_threshold': self.low_stock_threshold,
            'unit': self.unit,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'description': self.description,
            'is_active': self.is_active,
            'status': self.status,
            'profit_margin': self.profit_margin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

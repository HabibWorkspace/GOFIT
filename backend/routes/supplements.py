"""Supplement inventory management routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (
    Supplement, Supplier, SupplementStock, SupplementSale,
    MovementType, MemberProfile, User
)
from middleware.rbac import require_admin
from database import db
from utils.audit import log_action
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_, or_
from decimal import Decimal
import csv
from io import StringIO

supplements_bp = Blueprint('supplements', __name__)


# ============================================================================
# SUPPLIER ENDPOINTS
# ============================================================================

@supplements_bp.route('/suppliers', methods=['GET'])
@require_admin
def list_suppliers():
    """Get all suppliers."""
    try:
        suppliers = Supplier.query.order_by(Supplier.name).all()
        return jsonify({
            'suppliers': [s.to_dict() for s in suppliers]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching suppliers: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/suppliers', methods=['POST'])
@require_admin
def create_supplier():
    """Create a new supplier."""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Supplier name is required'}), 400
    
    try:
        supplier = Supplier(
            name=data['name'],
            contact=data.get('contact'),
            address=data.get('address')
        )
        
        db.session.add(supplier)
        log_action('created supplier', 'Supplier', supplier.id, {'name': supplier.name})
        db.session.commit()
        
        return jsonify(supplier.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating supplier: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SUPPLEMENT INVENTORY ENDPOINTS
# ============================================================================

@supplements_bp.route('/', methods=['GET'])
@require_admin
def list_supplements():
    """
    Get all supplements with filtering and search.
    
    Query params:
        - search: Search by name or brand
        - category: Filter by category
        - status: Filter by status (low_stock, expired, expiring_soon, good)
        - active_only: Show only active supplements (default: true)
    """
    try:
        query = Supplement.query
        
        # Active filter
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        if active_only:
            query = query.filter(Supplement.is_active == True)
        
        # Search filter
        search = request.args.get('search', '').strip()
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                or_(
                    Supplement.name.ilike(search_pattern),
                    Supplement.brand.ilike(search_pattern)
                )
            )
        
        # Category filter
        category = request.args.get('category')
        if category:
            query = query.filter(Supplement.category == category)
        
        supplements = query.order_by(Supplement.name).all()
        
        # Apply status filter if requested (done in Python since status is a property)
        status_filter = request.args.get('status')
        if status_filter:
            supplements = [s for s in supplements if s.status == status_filter]
        
        # Get alert counts
        today = date.today()
        low_stock_count = sum(1 for s in supplements if s.current_stock <= s.low_stock_threshold)
        expired_count = sum(1 for s in supplements if s.expiry_date and s.expiry_date < today)
        expiring_soon_count = sum(1 for s in supplements if s.expiry_date and today <= s.expiry_date <= today + timedelta(days=30))
        
        return jsonify({
            'supplements': [s.to_dict() for s in supplements],
            'alerts': {
                'low_stock': low_stock_count,
                'expired': expired_count,
                'expiring_soon': expiring_soon_count
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching supplements: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/<supplement_id>', methods=['GET'])
@require_admin
def get_supplement(supplement_id):
    """Get a single supplement by ID."""
    try:
        supplement = Supplement.query.get(supplement_id)
        if not supplement:
            return jsonify({'error': 'Supplement not found'}), 404
        
        return jsonify(supplement.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching supplement: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/', methods=['POST'])
@require_admin
def create_supplement():
    """Create a new supplement."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'purchase_price', 'selling_price']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: name, purchase_price, selling_price'}), 400
    
    # Validate prices
    try:
        purchase_price = Decimal(str(data['purchase_price']))
        selling_price = Decimal(str(data['selling_price']))
        
        if purchase_price < 0 or selling_price < 0:
            return jsonify({'error': 'Prices must be non-negative'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid price format'}), 400
    
    try:
        # Parse expiry date if provided
        expiry_date = None
        if data.get('expiry_date'):
            try:
                expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid expiry date format. Use YYYY-MM-DD'}), 400
        
        supplement = Supplement(
            name=data['name'],
            brand=data.get('brand'),
            category=data.get('category'),
            supplier_id=data.get('supplier_id'),
            purchase_price=purchase_price,
            selling_price=selling_price,
            current_stock=int(data.get('current_stock', 0)),
            low_stock_threshold=int(data.get('low_stock_threshold', 5)),
            unit=data.get('unit', 'unit'),
            expiry_date=expiry_date,
            description=data.get('description'),
            is_active=True
        )
        
        db.session.add(supplement)
        log_action('created supplement', 'Supplement', supplement.id, {
            'name': supplement.name,
            'brand': supplement.brand,
            'category': supplement.category
        })
        db.session.commit()
        
        return jsonify(supplement.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating supplement: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/<supplement_id>', methods=['PUT'])
@require_admin
def update_supplement(supplement_id):
    """Update a supplement."""
    supplement = Supplement.query.get(supplement_id)
    if not supplement:
        return jsonify({'error': 'Supplement not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Track changes for audit log
        changes = {}
        
        # Update fields
        if 'name' in data and data['name'] != supplement.name:
            changes['name'] = {'before': supplement.name, 'after': data['name']}
            supplement.name = data['name']
        
        if 'brand' in data and data['brand'] != supplement.brand:
            changes['brand'] = {'before': supplement.brand, 'after': data['brand']}
            supplement.brand = data['brand']
        
        if 'category' in data and data['category'] != supplement.category:
            changes['category'] = {'before': supplement.category, 'after': data['category']}
            supplement.category = data['category']
        
        if 'supplier_id' in data and data['supplier_id'] != supplement.supplier_id:
            changes['supplier_id'] = {'before': supplement.supplier_id, 'after': data['supplier_id']}
            supplement.supplier_id = data['supplier_id']
        
        if 'purchase_price' in data:
            new_price = Decimal(str(data['purchase_price']))
            if new_price != supplement.purchase_price:
                changes['purchase_price'] = {'before': float(supplement.purchase_price), 'after': float(new_price)}
                supplement.purchase_price = new_price
        
        if 'selling_price' in data:
            new_price = Decimal(str(data['selling_price']))
            if new_price != supplement.selling_price:
                changes['selling_price'] = {'before': float(supplement.selling_price), 'after': float(new_price)}
                supplement.selling_price = new_price
        
        if 'low_stock_threshold' in data:
            new_threshold = int(data['low_stock_threshold'])
            if new_threshold != supplement.low_stock_threshold:
                changes['low_stock_threshold'] = {'before': supplement.low_stock_threshold, 'after': new_threshold}
                supplement.low_stock_threshold = new_threshold
        
        if 'unit' in data and data['unit'] != supplement.unit:
            changes['unit'] = {'before': supplement.unit, 'after': data['unit']}
            supplement.unit = data['unit']
        
        if 'expiry_date' in data:
            new_expiry = None
            if data['expiry_date']:
                new_expiry = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            if new_expiry != supplement.expiry_date:
                changes['expiry_date'] = {
                    'before': supplement.expiry_date.isoformat() if supplement.expiry_date else None,
                    'after': new_expiry.isoformat() if new_expiry else None
                }
                supplement.expiry_date = new_expiry
        
        if 'description' in data and data['description'] != supplement.description:
            supplement.description = data['description']
        
        supplement.updated_at = datetime.utcnow()
        
        if changes:
            log_action('updated supplement', 'Supplement', supplement.id, changes)
        
        db.session.commit()
        
        return jsonify(supplement.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating supplement: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/<supplement_id>', methods=['DELETE'])
@require_admin
def delete_supplement(supplement_id):
    """Soft delete a supplement (set is_active to False)."""
    supplement = Supplement.query.get(supplement_id)
    if not supplement:
        return jsonify({'error': 'Supplement not found'}), 404
    
    try:
        supplement.is_active = False
        supplement.updated_at = datetime.utcnow()
        
        log_action('deleted supplement', 'Supplement', supplement.id, {
            'name': supplement.name,
            'current_stock': supplement.current_stock
        })
        db.session.commit()
        
        return jsonify({'message': 'Supplement deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting supplement: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# STOCK MANAGEMENT ENDPOINTS
# ============================================================================

@supplements_bp.route('/<supplement_id>/restock', methods=['POST'])
@require_admin
def restock_supplement(supplement_id):
    """
    Add stock to a supplement (purchase).
    
    Request body:
        {
            "quantity": integer (required),
            "purchase_price": number (optional, updates supplement purchase price),
            "supplier_id": string (optional),
            "expiry_date": "YYYY-MM-DD" (optional),
            "notes": string (optional)
        }
    """
    supplement = Supplement.query.get(supplement_id)
    if not supplement:
        return jsonify({'error': 'Supplement not found'}), 404
    
    data = request.get_json()
    if not data or 'quantity' not in data:
        return jsonify({'error': 'Quantity is required'}), 400
    
    try:
        quantity = int(data['quantity'])
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be positive'}), 400
        
        # Get purchase price (use provided or current)
        purchase_price = Decimal(str(data.get('purchase_price', supplement.purchase_price)))
        total_amount = purchase_price * quantity
        
        # Update supplement
        supplement.current_stock += quantity
        
        # Update purchase price if provided
        if 'purchase_price' in data:
            supplement.purchase_price = purchase_price
        
        # Update supplier if provided
        if 'supplier_id' in data:
            supplement.supplier_id = data['supplier_id']
        
        # Update expiry date if provided
        if 'expiry_date' in data and data['expiry_date']:
            supplement.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        
        supplement.updated_at = datetime.utcnow()
        
        # Create stock movement record
        user_id = get_jwt_identity()
        stock_movement = SupplementStock(
            supplement_id=supplement.id,
            movement_type=MovementType.PURCHASE,
            quantity=quantity,
            unit_price=purchase_price,
            total_amount=total_amount,
            notes=data.get('notes'),
            created_by=user_id
        )
        
        db.session.add(stock_movement)
        log_action('restocked supplement', 'Supplement', supplement.id, {
            'name': supplement.name,
            'quantity': quantity,
            'new_stock': supplement.current_stock
        })
        db.session.commit()
        
        return jsonify({
            'message': 'Stock added successfully',
            'supplement': supplement.to_dict(),
            'movement': stock_movement.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({'error': 'Invalid quantity or price format'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error restocking supplement: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/<supplement_id>/adjust-stock', methods=['POST'])
@require_admin
def adjust_stock(supplement_id):
    """
    Manually adjust stock (for corrections, expired items, etc.).
    
    Request body:
        {
            "quantity": integer (can be negative),
            "reason": string (required),
            "movement_type": "adjustment" or "expired"
        }
    """
    supplement = Supplement.query.get(supplement_id)
    if not supplement:
        return jsonify({'error': 'Supplement not found'}), 404
    
    data = request.get_json()
    if not data or 'quantity' not in data or 'reason' not in data:
        return jsonify({'error': 'Quantity and reason are required'}), 400
    
    try:
        quantity = int(data['quantity'])
        movement_type_str = data.get('movement_type', 'adjustment')
        
        # Validate movement type
        if movement_type_str not in ['adjustment', 'expired']:
            return jsonify({'error': 'Invalid movement type'}), 400
        
        movement_type = MovementType.ADJUSTMENT if movement_type_str == 'adjustment' else MovementType.EXPIRED
        
        # Check if adjustment would result in negative stock
        new_stock = supplement.current_stock + quantity
        if new_stock < 0:
            return jsonify({'error': f'Adjustment would result in negative stock. Current: {supplement.current_stock}'}), 400
        
        # Update stock
        old_stock = supplement.current_stock
        supplement.current_stock = new_stock
        supplement.updated_at = datetime.utcnow()
        
        # Create stock movement record
        user_id = get_jwt_identity()
        stock_movement = SupplementStock(
            supplement_id=supplement.id,
            movement_type=movement_type,
            quantity=quantity,
            unit_price=supplement.purchase_price,
            total_amount=supplement.purchase_price * abs(quantity),
            notes=data['reason'],
            created_by=user_id
        )
        
        db.session.add(stock_movement)
        log_action(f'adjusted stock ({movement_type_str})', 'Supplement', supplement.id, {
            'name': supplement.name,
            'quantity': quantity,
            'old_stock': old_stock,
            'new_stock': new_stock,
            'reason': data['reason']
        })
        db.session.commit()
        
        return jsonify({
            'message': 'Stock adjusted successfully',
            'supplement': supplement.to_dict(),
            'movement': stock_movement.to_dict()
        }), 200
    except ValueError:
        return jsonify({'error': 'Invalid quantity format'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adjusting stock: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SALES ENDPOINTS
# ============================================================================

@supplements_bp.route('/sell', methods=['POST'])
@require_admin
def record_sale():
    """
    Record a supplement sale.
    
    Request body:
        {
            "supplement_id": string (required),
            "quantity": integer (required),
            "unit_price": number (optional, defaults to supplement selling_price),
            "member_id": string (optional, null for walk-in customers),
            "payment_method": string (optional, default: "cash")
        }
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or 'supplement_id' not in data or 'quantity' not in data:
        return jsonify({'error': 'supplement_id and quantity are required'}), 400
    
    supplement = Supplement.query.get(data['supplement_id'])
    if not supplement:
        return jsonify({'error': 'Supplement not found'}), 404
    
    if not supplement.is_active:
        return jsonify({'error': 'Supplement is not active'}), 400
    
    try:
        quantity = int(data['quantity'])
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be positive'}), 400
        
        # Check stock availability
        if supplement.current_stock < quantity:
            return jsonify({
                'error': f'Insufficient stock. Available: {supplement.current_stock}, Requested: {quantity}'
            }), 400
        
        # Get unit price (use provided or current selling price)
        unit_price = Decimal(str(data.get('unit_price', supplement.selling_price)))
        total_amount = unit_price * quantity
        
        # Calculate profit
        profit = (unit_price - supplement.purchase_price) * quantity
        
        # Validate member if provided
        member_id = data.get('member_id')
        if member_id:
            member = MemberProfile.query.get(member_id)
            if not member:
                return jsonify({'error': 'Member not found'}), 404
        
        # Create sale record
        user_id = get_jwt_identity()
        sale = SupplementSale(
            supplement_id=supplement.id,
            member_id=member_id,
            quantity=quantity,
            unit_price=unit_price,
            total_amount=total_amount,
            profit=profit,
            payment_method=data.get('payment_method', 'cash'),
            sold_by=user_id
        )
        
        # Update stock
        supplement.current_stock -= quantity
        supplement.updated_at = datetime.utcnow()
        
        # Create stock movement record
        stock_movement = SupplementStock(
            supplement_id=supplement.id,
            movement_type=MovementType.SALE,
            quantity=-quantity,  # Negative for stock out
            unit_price=unit_price,
            total_amount=total_amount,
            reference_id=sale.id,
            notes=f'Sale to {sale.member.full_name if member_id else "Walk-in customer"}',
            created_by=user_id
        )
        
        db.session.add(sale)
        db.session.add(stock_movement)
        log_action('recorded supplement sale', 'SupplementSale', sale.id, {
            'supplement': supplement.name,
            'quantity': quantity,
            'total_amount': float(total_amount),
            'profit': float(profit),
            'member': sale.member.full_name if member_id else 'Walk-in'
        })
        db.session.commit()
        
        return jsonify({
            'message': 'Sale recorded successfully',
            'sale': sale.to_dict(),
            'supplement': supplement.to_dict()
        }), 201
    except ValueError:
        return jsonify({'error': 'Invalid quantity or price format'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error recording sale: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/sales', methods=['GET'])
@require_admin
def list_sales():
    """
    Get sales history with filtering.
    
    Query params:
        - supplement_id: Filter by supplement
        - member_id: Filter by member
        - start_date: Filter by date range (YYYY-MM-DD)
        - end_date: Filter by date range (YYYY-MM-DD)
        - page: Page number (default: 1)
        - per_page: Items per page (default: 30)
    """
    try:
        query = SupplementSale.query
        
        # Filters
        supplement_id = request.args.get('supplement_id')
        if supplement_id:
            query = query.filter(SupplementSale.supplement_id == supplement_id)
        
        member_id = request.args.get('member_id')
        if member_id:
            query = query.filter(SupplementSale.member_id == member_id)
        
        start_date = request.args.get('start_date')
        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(SupplementSale.sold_at >= start_dt)
        
        end_date = request.args.get('end_date')
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
            query = query.filter(SupplementSale.sold_at <= end_dt)
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 30, type=int)
        
        pagination = query.order_by(SupplementSale.sold_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Calculate totals for filtered results
        total_revenue = db.session.query(func.sum(SupplementSale.total_amount)).filter(
            SupplementSale.id.in_([s.id for s in pagination.items])
        ).scalar() or 0
        
        total_profit = db.session.query(func.sum(SupplementSale.profit)).filter(
            SupplementSale.id.in_([s.id for s in pagination.items])
        ).scalar() or 0
        
        return jsonify({
            'sales': [s.to_dict() for s in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages,
            'summary': {
                'total_revenue': float(total_revenue),
                'total_profit': float(total_profit)
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching sales: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# REPORTS & ANALYTICS ENDPOINTS
# ============================================================================

@supplements_bp.route('/reports/profit-loss', methods=['GET'])
@require_admin
def profit_loss_report():
    """
    Generate profit/loss report for a date range.
    
    Query params:
        - start_date: Start date (YYYY-MM-DD, default: first day of current month)
        - end_date: End date (YYYY-MM-DD, default: today)
    """
    try:
        # Default to current month
        today = date.today()
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date:
            start_date = today.replace(day=1)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        
        if not end_date:
            end_date = today
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get sales in date range
        sales = SupplementSale.query.filter(
            and_(
                func.date(SupplementSale.sold_at) >= start_date,
                func.date(SupplementSale.sold_at) <= end_date
            )
        ).all()
        
        # Calculate totals
        total_revenue = sum(float(s.total_amount) for s in sales)
        total_cost = sum(float(s.unit_price - (s.profit / s.quantity)) * s.quantity for s in sales)
        total_profit = sum(float(s.profit) for s in sales)
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Best selling supplements
        best_sellers = db.session.query(
            Supplement.id,
            Supplement.name,
            Supplement.brand,
            func.sum(SupplementSale.quantity).label('total_quantity'),
            func.sum(SupplementSale.total_amount).label('total_revenue'),
            func.sum(SupplementSale.profit).label('total_profit')
        ).join(SupplementSale).filter(
            and_(
                func.date(SupplementSale.sold_at) >= start_date,
                func.date(SupplementSale.sold_at) <= end_date
            )
        ).group_by(Supplement.id).order_by(func.sum(SupplementSale.quantity).desc()).limit(10).all()
        
        # Current stock value
        active_supplements = Supplement.query.filter(Supplement.is_active == True).all()
        stock_value = sum(float(s.purchase_price) * s.current_stock for s in active_supplements)
        
        # Expiring soon (within 30 days)
        expiring_soon = Supplement.query.filter(
            and_(
                Supplement.is_active == True,
                Supplement.expiry_date.isnot(None),
                Supplement.expiry_date <= today + timedelta(days=30),
                Supplement.expiry_date >= today
            )
        ).order_by(Supplement.expiry_date).all()
        
        return jsonify({
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'summary': {
                'total_revenue': round(total_revenue, 2),
                'total_cost': round(total_cost, 2),
                'total_profit': round(total_profit, 2),
                'profit_margin': round(profit_margin, 2),
                'total_sales': len(sales),
                'stock_value': round(stock_value, 2)
            },
            'best_sellers': [{
                'id': b.id,
                'name': b.name,
                'brand': b.brand,
                'quantity_sold': int(b.total_quantity),
                'revenue': float(b.total_revenue),
                'profit': float(b.total_profit)
            } for b in best_sellers],
            'expiring_soon': [s.to_dict() for s in expiring_soon]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error generating report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/categories', methods=['GET'])
@require_admin
def get_categories():
    """Get list of all unique supplement categories."""
    try:
        categories = db.session.query(Supplement.category).filter(
            and_(
                Supplement.category.isnot(None),
                Supplement.is_active == True
            )
        ).distinct().order_by(Supplement.category).all()
        
        return jsonify({
            'categories': [c[0] for c in categories if c[0]]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({'error': str(e)}), 500


@supplements_bp.route('/stock-movements/<supplement_id>', methods=['GET'])
@require_admin
def get_stock_movements(supplement_id):
    """Get stock movement history for a supplement."""
    try:
        supplement = Supplement.query.get(supplement_id)
        if not supplement:
            return jsonify({'error': 'Supplement not found'}), 404
        
        movements = SupplementStock.query.filter(
            SupplementStock.supplement_id == supplement_id
        ).order_by(SupplementStock.created_at.desc()).limit(100).all()
        
        return jsonify({
            'supplement': supplement.to_dict(),
            'movements': [m.to_dict() for m in movements]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching stock movements: {str(e)}")
        return jsonify({'error': str(e)}), 500

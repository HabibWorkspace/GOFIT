"""Trainer commission routes for managing trainer earnings and payments."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from middleware.rbac import require_admin, require_super_admin
from database import db
from models import (
    TrainerProfile, TrainerMemberCharge, TrainerSalarySlip,
    MemberProfile, User, PaymentStatus
)
from utils.audit import log_action
from datetime import datetime, date
from sqlalchemy import func, and_
from dateutil.relativedelta import relativedelta

trainer_commission_bp = Blueprint('trainer_commission', __name__)


@trainer_commission_bp.route('/trainers/<trainer_id>/profile', methods=['GET'])
@require_admin
def get_trainer_profile(trainer_id):
    """
    Get enhanced trainer profile with earnings breakdown.
    
    Query params:
        - month: Month in YYYY-MM format (default: current month)
    
    Returns trainer info, assigned members with charges, and earnings breakdown.
    """
    try:
        trainer = TrainerProfile.query.get(trainer_id)
        
        if not trainer:
            return jsonify({'error': 'Trainer not found'}), 404
        
        # Get month parameter
        month_str = request.args.get('month')
        if month_str:
            year, month = map(int, month_str.split('-'))
            month_date = date(year, month, 1)
        else:
            now = datetime.utcnow()
            month_date = date(now.year, now.month, 1)
        
        # Get assigned members
        assigned_members = MemberProfile.query.filter_by(trainer_id=trainer_id).all()
        
        # Get charges for this month
        charges = TrainerMemberCharge.query.filter(
            and_(
                TrainerMemberCharge.trainer_id == trainer_id,
                TrainerMemberCharge.month_year == month_date
            )
        ).all()
        
        # Calculate earnings
        total_billed = sum(float(charge.monthly_charge) for charge in charges)
        gym_commission = sum(float(charge.gym_cut) for charge in charges)
        trainer_earnings = sum(float(charge.trainer_cut) for charge in charges)
        amount_paid_to_trainer = sum(float(charge.trainer_cut) for charge in charges if charge.trainer_paid)
        balance_owed = trainer_earnings - amount_paid_to_trainer
        
        # Get member details with charges
        members_with_charges = []
        for member in assigned_members:
            charge = next((c for c in charges if c.member_id == member.id), None)
            members_with_charges.append({
                **member.to_dict(),
                'charge': charge.to_dict() if charge else None
            })
        
        return jsonify({
            'trainer': trainer.to_dict(),
            'assigned_members': members_with_charges,
            'earnings': {
                'month': month_date.isoformat(),
                'total_billed': total_billed,
                'gym_commission': gym_commission,
                'trainer_earnings': trainer_earnings,
                'amount_paid': amount_paid_to_trainer,
                'balance_owed': balance_owed,
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching trainer profile: {str(e)}")
        return jsonify({'error': str(e)}), 500


@trainer_commission_bp.route('/trainers/<trainer_id>/mark-paid', methods=['POST'])
@require_super_admin
def mark_trainer_paid(trainer_id):
    """
    Mark trainer as paid for a specific month (super admin only).
    
    Expected JSON:
    {
        "month_year": "2026-04-01",
        "amount_paid": 15000.00,
        "payment_date": "2026-04-18",
        "notes": "Paid via bank transfer"
    }
    """
    try:
        data = request.get_json()
        month_year_str = data.get('month_year')
        amount_paid = data.get('amount_paid')
        payment_date_str = data.get('payment_date')
        notes = data.get('notes', '')
        
        if not month_year_str or amount_paid is None:
            return jsonify({'error': 'month_year and amount_paid are required'}), 400
        
        month_year = datetime.fromisoformat(month_year_str).date()
        payment_date = datetime.fromisoformat(payment_date_str).date() if payment_date_str else date.today()
        
        # Get all charges for this trainer and month
        charges = TrainerMemberCharge.query.filter(
            and_(
                TrainerMemberCharge.trainer_id == trainer_id,
                TrainerMemberCharge.month_year == month_year
            )
        ).all()
        
        if not charges:
            return jsonify({'error': 'No charges found for this month'}), 404
        
        # Mark all charges as paid
        for charge in charges:
            charge.trainer_paid = True
            charge.trainer_paid_date = payment_date
        
        # Calculate totals
        total_members = len(charges)
        total_charges = sum(float(charge.monthly_charge) for charge in charges)
        gym_total_cut = sum(float(charge.gym_cut) for charge in charges)
        trainer_total_cut = sum(float(charge.trainer_cut) for charge in charges)
        
        # Create salary slip
        user_id = get_jwt_identity()
        salary_slip = TrainerSalarySlip(
            trainer_id=trainer_id,
            month_year=month_year,
            total_members_billed=total_members,
            total_charges=total_charges,
            gym_total_cut=gym_total_cut,
            trainer_total_cut=trainer_total_cut,
            amount_paid=amount_paid,
            payment_date=payment_date,
            notes=notes,
            generated_by=user_id
        )
        
        db.session.add(salary_slip)
        
        # Log the action
        log_action(
            action='marked trainer paid',
            target_type='Trainer',
            target_id=trainer_id,
            details={
                'month': month_year.isoformat(),
                'amount_paid': float(amount_paid),
                'payment_date': payment_date.isoformat()
            }
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Trainer marked as paid successfully',
            'salary_slip': salary_slip.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error marking trainer as paid: {str(e)}")
        return jsonify({'error': str(e)}), 500


@trainer_commission_bp.route('/trainers/<trainer_id>/salary-slip/<month_year>', methods=['GET'])
@require_admin
def get_salary_slip(trainer_id, month_year):
    """
    Get salary slip for a specific trainer and month.
    Returns printable salary slip data.
    """
    try:
        month_date = datetime.strptime(month_year, '%Y-%m').date().replace(day=1)
        
        # Get salary slip
        salary_slip = TrainerSalarySlip.query.filter(
            and_(
                TrainerSalarySlip.trainer_id == trainer_id,
                TrainerSalarySlip.month_year == month_date
            )
        ).first()
        
        if not salary_slip:
            return jsonify({'error': 'Salary slip not found'}), 404
        
        # Get trainer details
        trainer = TrainerProfile.query.get(trainer_id)
        
        # Get member charges for this month
        charges = TrainerMemberCharge.query.filter(
            and_(
                TrainerMemberCharge.trainer_id == trainer_id,
                TrainerMemberCharge.month_year == month_date
            )
        ).all()
        
        # Get member details
        member_charges = []
        for charge in charges:
            member = MemberProfile.query.get(charge.member_id)
            member_charges.append({
                'member_name': member.full_name if member else 'Unknown',
                'member_number': member.member_number if member else 'N/A',
                'monthly_charge': float(charge.monthly_charge),
                'trainer_cut': float(charge.trainer_cut),
            })
        
        return jsonify({
            'salary_slip': salary_slip.to_dict(),
            'trainer': trainer.to_dict(),
            'member_charges': member_charges
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching salary slip: {str(e)}")
        return jsonify({'error': str(e)}), 500


@trainer_commission_bp.route('/trainers/commissions', methods=['GET'])
@require_super_admin
def get_all_trainer_commissions():
    """
    Get commission overview for all trainers (super admin only).
    
    Query params:
        - month: Month in YYYY-MM format (default: current month)
    
    Returns summary of all trainers' commissions for the month.
    """
    try:
        # Get month parameter
        month_str = request.args.get('month')
        if month_str:
            year, month = map(int, month_str.split('-'))
            month_date = date(year, month, 1)
        else:
            now = datetime.utcnow()
            month_date = date(now.year, now.month, 1)
        
        # Get all trainers
        trainers = TrainerProfile.query.all()
        
        trainer_commissions = []
        total_gym_commission = 0
        total_trainer_commission = 0
        
        for trainer in trainers:
            # Get charges for this trainer and month
            charges = TrainerMemberCharge.query.filter(
                and_(
                    TrainerMemberCharge.trainer_id == trainer.id,
                    TrainerMemberCharge.month_year == month_date
                )
            ).all()
            
            members_count = len(charges)
            total_owed = sum(float(charge.trainer_cut) for charge in charges)
            paid = all(charge.trainer_paid for charge in charges) if charges else False
            
            gym_cut = sum(float(charge.gym_cut) for charge in charges)
            
            total_gym_commission += gym_cut
            total_trainer_commission += total_owed
            
            trainer_commissions.append({
                'trainer_id': trainer.id,
                'trainer_name': trainer.full_name,
                'members_count': members_count,
                'total_owed': total_owed,
                'paid': paid,
                'gym_cut': gym_cut
            })
        
        return jsonify({
            'month': month_date.isoformat(),
            'trainers': trainer_commissions,
            'totals': {
                'gym_commission': total_gym_commission,
                'trainer_commission': total_trainer_commission
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching trainer commissions: {str(e)}")
        return jsonify({'error': str(e)}), 500


@trainer_commission_bp.route('/trainers/<trainer_id>/charges', methods=['POST'])
@require_admin
def create_trainer_charge(trainer_id):
    """
    Create or update a trainer charge for a member.
    
    Expected JSON:
    {
        "member_id": "member-uuid",
        "monthly_charge": 5000.00,
        "month_year": "2026-04-01",
        "amount_paid_by_member": 5000.00  // Optional
    }
    """
    try:
        data = request.get_json()
        member_id = data.get('member_id')
        monthly_charge = data.get('monthly_charge')
        month_year_str = data.get('month_year')
        amount_paid_by_member = data.get('amount_paid_by_member', 0)
        
        if not member_id or monthly_charge is None:
            return jsonify({'error': 'member_id and monthly_charge are required'}), 400
        
        # Get trainer
        trainer = TrainerProfile.query.get(trainer_id)
        if not trainer:
            return jsonify({'error': 'Trainer not found'}), 404
        
        # Parse month_year
        if month_year_str:
            month_year = datetime.fromisoformat(month_year_str).date()
        else:
            now = datetime.utcnow()
            month_year = date(now.year, now.month, 1)
        
        # Calculate cuts
        gym_cut = float(monthly_charge) * float(trainer.gym_commission_percent) / 100
        trainer_cut = float(monthly_charge) * float(trainer.trainer_commission_percent) / 100
        
        # Determine payment status
        amount_paid = float(amount_paid_by_member)
        if amount_paid >= float(monthly_charge):
            payment_status = PaymentStatus.PAID
        elif amount_paid > 0:
            payment_status = PaymentStatus.PARTIAL
        else:
            payment_status = PaymentStatus.PENDING
        
        # Check if charge already exists
        existing_charge = TrainerMemberCharge.query.filter(
            and_(
                TrainerMemberCharge.trainer_id == trainer_id,
                TrainerMemberCharge.member_id == member_id,
                TrainerMemberCharge.month_year == month_year
            )
        ).first()
        
        if existing_charge:
            # Update existing charge
            existing_charge.monthly_charge = monthly_charge
            existing_charge.gym_cut = gym_cut
            existing_charge.trainer_cut = trainer_cut
            existing_charge.amount_paid_by_member = amount_paid
            existing_charge.payment_status = payment_status
            # If member has paid in full, mark trainer as ready to be paid
            if payment_status == PaymentStatus.PAID:
                existing_charge.trainer_paid = False  # Ready to be paid by super admin
            charge = existing_charge
            action = 'updated trainer charge'
        else:
            # Create new charge
            charge = TrainerMemberCharge(
                trainer_id=trainer_id,
                member_id=member_id,
                monthly_charge=monthly_charge,
                gym_cut=gym_cut,
                trainer_cut=trainer_cut,
                month_year=month_year,
                amount_paid_by_member=amount_paid,
                payment_status=payment_status,
                trainer_paid=False if payment_status == PaymentStatus.PAID else False
            )
            db.session.add(charge)
            action = 'created trainer charge'
        
        # Log the action
        log_action(
            action=action,
            target_type='TrainerCharge',
            target_id=charge.id if existing_charge else None,
            details={
                'trainer_id': trainer_id,
                'member_id': member_id,
                'monthly_charge': float(monthly_charge),
                'amount_paid_by_member': amount_paid,
                'month': month_year.isoformat()
            }
        )
        
        db.session.commit()
        
        return jsonify({
            'message': f'Trainer charge {action.split()[0]} successfully',
            'charge': charge.to_dict()
        }), 201 if not existing_charge else 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating trainer charge: {str(e)}")
        return jsonify({'error': str(e)}), 500

"""
Add test finance data for demo purposes.
Creates realistic payment scenarios including overdue and grace period cases.
"""
from app import create_app
from database import db
from models.member_profile import MemberProfile
from models.transaction import Transaction, TransactionStatus, TransactionType
from models.settings import Settings
from datetime import datetime, timedelta
import random

def add_test_finance_data():
    """Add test finance transactions for demo."""
    app, _ = create_app()
    
    with app.app_context():
        print("=" * 70)
        print("ADDING TEST FINANCE DATA")
        print("=" * 70)
        print()
        
        # Get settings for grace period
        settings = Settings.query.first()
        grace_period = settings.grace_period_days if settings else 3
        print(f"Grace Period: {grace_period} days")
        print()
        
        # Get all active members
        members = MemberProfile.query.filter(
            MemberProfile.member_number.isnot(None)
        ).all()
        
        if not members:
            print("❌ No members found. Please add members first.")
            return
        
        print(f"Found {len(members)} members")
        print()
        
        # Clear existing test transactions (optional - comment out if you want to keep existing)
        # Transaction.query.delete()
        # db.session.commit()
        # print("Cleared existing transactions")
        
        # Current date
        today = datetime.utcnow()
        
        # Scenario 1: OVERDUE PAYMENTS (Past grace period)
        print("📌 Creating OVERDUE payments (past grace period)...")
        overdue_count = min(5, len(members))
        for i in range(overdue_count):
            member = members[i]
            
            # Create payment 10-30 days overdue (past grace period)
            days_overdue = random.randint(grace_period + 1, 30)
            due_date = today - timedelta(days=days_overdue)
            
            transaction = Transaction(
                member_id=member.id,
                amount=20000.00,
                transaction_type=TransactionType.PAYMENT,
                status=TransactionStatus.PENDING,
                due_date=due_date,
                paid_date=None,
                package_price=20000.00,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
            print(f"  ✓ {member.full_name} - Rs. 20,000 - {days_overdue} days overdue")
        
        # Scenario 2: GRACE PERIOD PAYMENTS (Within grace period)
        print()
        print(f"📌 Creating GRACE PERIOD payments (within {grace_period} days)...")
        grace_count = min(3, len(members) - overdue_count)
        for i in range(overdue_count, overdue_count + grace_count):
            member = members[i]
            
            # Create payment 1-3 days past due (within grace period)
            days_past = random.randint(1, grace_period)
            due_date = today - timedelta(days=days_past)
            
            transaction = Transaction(
                member_id=member.id,
                amount=20000.00,
                transaction_type=TransactionType.PAYMENT,
                status=TransactionStatus.PENDING,
                due_date=due_date,
                paid_date=None,
                package_price=20000.00,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
            print(f"  ✓ {member.full_name} - Rs. 20,000 - Grace Day {days_past}")
        
        # Scenario 3: PENDING PAYMENTS (Not yet due)
        print()
        print("📌 Creating PENDING payments (not yet due)...")
        pending_count = min(10, len(members) - overdue_count - grace_count)
        for i in range(overdue_count + grace_count, overdue_count + grace_count + pending_count):
            member = members[i]
            
            # Create payment due in 1-15 days
            days_until_due = random.randint(1, 15)
            due_date = today + timedelta(days=days_until_due)
            
            transaction = Transaction(
                member_id=member.id,
                amount=20000.00,
                transaction_type=TransactionType.PAYMENT,
                status=TransactionStatus.PENDING,
                due_date=due_date,
                paid_date=None,
                package_price=20000.00,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
            print(f"  ✓ {member.full_name} - Rs. 20,000 - Due in {days_until_due} days")
        
        # Scenario 4: COMPLETED PAYMENTS (This month)
        print()
        print("📌 Creating COMPLETED payments (this month)...")
        completed_count = min(15, len(members) - overdue_count - grace_count - pending_count)
        for i in range(overdue_count + grace_count + pending_count, 
                      overdue_count + grace_count + pending_count + completed_count):
            member = members[i]
            
            # Create completed payment (paid 1-20 days ago)
            days_ago = random.randint(1, 20)
            due_date = today - timedelta(days=days_ago + 5)
            paid_date = today - timedelta(days=days_ago)
            
            transaction = Transaction(
                member_id=member.id,
                amount=20000.00,
                transaction_type=TransactionType.PAYMENT,
                status=TransactionStatus.COMPLETED,
                due_date=due_date,
                paid_date=paid_date,
                package_price=20000.00,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
            print(f"  ✓ {member.full_name} - Rs. 20,000 - Paid {days_ago} days ago")
        
        # Scenario 5: PREVIOUS MONTHS DATA
        print()
        print("📌 Creating PREVIOUS MONTHS data...")
        
        # Last month
        last_month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        for i in range(min(20, len(members))):
            member = members[i]
            
            # Random day in last month
            day_offset = random.randint(0, 28)
            due_date = last_month_start + timedelta(days=day_offset)
            
            # 80% completed, 20% pending
            is_completed = random.random() < 0.8
            
            transaction = Transaction(
                member_id=member.id,
                amount=20000.00,
                transaction_type=TransactionType.PAYMENT,
                status=TransactionStatus.COMPLETED if is_completed else TransactionStatus.PENDING,
                due_date=due_date,
                paid_date=due_date + timedelta(days=random.randint(0, 5)) if is_completed else None,
                package_price=20000.00,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
        print(f"  ✓ Added 20 transactions for last month")
        
        # 2 months ago
        two_months_ago = (last_month_start - timedelta(days=1)).replace(day=1)
        for i in range(min(20, len(members))):
            member = members[i]
            
            day_offset = random.randint(0, 28)
            due_date = two_months_ago + timedelta(days=day_offset)
            
            transaction = Transaction(
                member_id=member.id,
                amount=20000.00,
                transaction_type=TransactionType.PAYMENT,
                status=TransactionStatus.COMPLETED,
                due_date=due_date,
                paid_date=due_date + timedelta(days=random.randint(0, 5)),
                package_price=20000.00,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
        print(f"  ✓ Added 20 transactions for 2 months ago")
        
        # Scenario 6: PACKAGE PURCHASES
        print()
        print("📌 Creating PACKAGE purchases...")
        for i in range(min(5, len(members))):
            member = members[i]
            
            days_ago = random.randint(1, 30)
            purchase_date = today - timedelta(days=days_ago)
            
            transaction = Transaction(
                member_id=member.id,
                amount=10000.00,
                transaction_type=TransactionType.PACKAGE,
                status=TransactionStatus.COMPLETED,
                due_date=purchase_date,
                paid_date=purchase_date,
                package_price=10000.00,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
            print(f"  ✓ {member.full_name} - Package Rs. 10,000")
        
        # Scenario 7: ADMISSION FEES
        print()
        print("📌 Creating ADMISSION fees...")
        for i in range(min(3, len(members))):
            member = members[i]
            
            days_ago = random.randint(30, 90)
            admission_date = today - timedelta(days=days_ago)
            
            transaction = Transaction(
                member_id=member.id,
                amount=5000.00,
                transaction_type=TransactionType.ADMISSION,
                status=TransactionStatus.COMPLETED,
                due_date=admission_date,
                paid_date=admission_date,
                package_price=0,
                trainer_fee=0,
                discount_amount=0,
                discount_type='fixed'
            )
            db.session.add(transaction)
            print(f"  ✓ {member.full_name} - Admission Rs. 5,000")
        
        # Commit all transactions
        db.session.commit()
        
        print()
        print("=" * 70)
        print("✅ TEST FINANCE DATA ADDED SUCCESSFULLY!")
        print("=" * 70)
        print()
        print("Summary:")
        print(f"  • Overdue Payments: {overdue_count} (past grace period)")
        print(f"  • Grace Period Payments: {grace_count} (within {grace_period} days)")
        print(f"  • Pending Payments: {pending_count} (not yet due)")
        print(f"  • Completed Payments: {completed_count} (this month)")
        print(f"  • Previous Months: 40 transactions")
        print(f"  • Package Purchases: 5")
        print(f"  • Admission Fees: 3")
        print()
        print("You can now demo the Finance page with realistic data!")
        print()


if __name__ == '__main__':
    add_test_finance_data()

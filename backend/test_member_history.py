"""Test script to create sample transactions for a member to verify history sections."""
from database import db
from models.member_profile import MemberProfile
from models.transaction import Transaction, TransactionType, TransactionStatus
from models.package import Package
from app import app
from datetime import datetime, timedelta

def create_test_transactions():
    """Create test transactions for the first member."""
    with app.app_context():
        # Get first member
        member = MemberProfile.query.first()
        if not member:
            print("No members found!")
            return
        
        print(f"Creating test transactions for: {member.full_name}")
        print(f"Member ID: {member.id}")
        
        # Get a package
        package = Package.query.filter_by(is_active=True).first()
        if not package:
            print("No active packages found!")
            return
        
        print(f"Using package: {package.name} - Rs.{package.price} ({package.duration_days} days)")
        
        # Create admission transaction (COMPLETED)
        admission_txn = Transaction(
            member_id=member.id,
            amount=5000.0,
            transaction_type=TransactionType.ADMISSION,
            status=TransactionStatus.COMPLETED,
            due_date=datetime.utcnow() - timedelta(days=60),
            paid_date=datetime.utcnow() - timedelta(days=60),
            created_at=datetime.utcnow() - timedelta(days=60)
        )
        db.session.add(admission_txn)
        
        # Create first package transaction (COMPLETED) - 60 days ago
        package_txn_1 = Transaction(
            member_id=member.id,
            amount=float(package.price),
            transaction_type=TransactionType.PACKAGE,
            status=TransactionStatus.COMPLETED,
            due_date=datetime.utcnow() - timedelta(days=60),
            paid_date=datetime.utcnow() - timedelta(days=60),
            package_price=float(package.price),
            created_at=datetime.utcnow() - timedelta(days=60)
        )
        db.session.add(package_txn_1)
        
        # Create second package transaction (COMPLETED) - 30 days ago
        package_txn_2 = Transaction(
            member_id=member.id,
            amount=float(package.price),
            transaction_type=TransactionType.PACKAGE,
            status=TransactionStatus.COMPLETED,
            due_date=datetime.utcnow() - timedelta(days=30),
            paid_date=datetime.utcnow() - timedelta(days=30),
            package_price=float(package.price),
            created_at=datetime.utcnow() - timedelta(days=30)
        )
        db.session.add(package_txn_2)
        
        # Create current package transaction (PENDING)
        package_txn_3 = Transaction(
            member_id=member.id,
            amount=float(package.price),
            transaction_type=TransactionType.PACKAGE,
            status=TransactionStatus.PENDING,
            due_date=datetime.utcnow() + timedelta(days=5),
            package_price=float(package.price),
            created_at=datetime.utcnow()
        )
        db.session.add(package_txn_3)
        
        try:
            db.session.commit()
            print("\n✓ Successfully created test transactions:")
            print(f"  - 1 Admission transaction (COMPLETED)")
            print(f"  - 2 Package transactions (COMPLETED)")
            print(f"  - 1 Package transaction (PENDING)")
            print(f"\nMember {member.full_name} now has transaction history!")
            print(f"View at: /admin/member-details?id={member.id}")
        except Exception as e:
            db.session.rollback()
            print(f"\n✗ Error creating transactions: {e}")

if __name__ == '__main__':
    create_test_transactions()

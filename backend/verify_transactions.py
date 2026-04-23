"""Verify transactions were created."""
from database import db
from models.member_profile import MemberProfile
from models.transaction import Transaction
from app import app

with app.app_context():
    member = MemberProfile.query.first()
    transactions = Transaction.query.filter_by(member_id=member.id).all()
    
    print(f'Member: {member.full_name}')
    print(f'Total Transactions: {len(transactions)}\n')
    
    for i, t in enumerate(transactions, 1):
        print(f'{i}. {t.transaction_type.value}: Rs.{t.amount} - {t.status.value}')
        print(f'   Due: {t.due_date.strftime("%Y-%m-%d")}')
        if t.paid_date:
            print(f'   Paid: {t.paid_date.strftime("%Y-%m-%d")}')
        print()

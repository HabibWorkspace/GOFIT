"""
Script to delete all transactions from the database (AUTO - NO CONFIRMATION).
WARNING: This will permanently delete all transaction records!
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import db
from models.transaction import Transaction
from app import create_app

def delete_all_transactions():
    """Delete all transactions from the database."""
    app, socketio = create_app()
    
    with app.app_context():
        try:
            # Count transactions before deletion
            count = Transaction.query.count()
            print(f"Found {count} transactions in database")
            
            if count == 0:
                print("✅ No transactions to delete.")
                return
            
            # Delete all transactions (NO CONFIRMATION)
            print(f"\n🗑️  Deleting {count} transactions...")
            deleted = Transaction.query.delete()
            db.session.commit()
            
            print(f"✅ Successfully deleted {deleted} transactions!")
            print("\n📊 Database is now clean - all transactions removed.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error deleting transactions: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    delete_all_transactions()

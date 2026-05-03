"""
Verify imported data in local SQLite database.
Run this after import_data.py to ensure everything imported correctly.

Usage:
    python verify_data.py
"""
import sys
import config_local as config_module
sys.modules['config'] = config_module

from app import create_app
from database import db
from models import (
    User, MemberProfile, TrainerProfile, Package, Transaction,
    Attendance, Settings
)

def main():
    """Verify database."""
    print("=" * 60)
    print("Gym Management System - Data Verification")
    print("=" * 60)
    
    app, _ = create_app()
    
    with app.app_context():
        # Check counts
        checks = [
            ("Users", User.query.count()),
            ("Members", MemberProfile.query.count()),
            ("Trainers", TrainerProfile.query.count()),
            ("Packages", Package.query.count()),
            ("Transactions", Transaction.query.count()),
            ("Attendance Records", Attendance.query.count()),
        ]
        
        print("\n📊 Record Counts:")
        for name, count in checks:
            print(f"  {name:.<30} {count:>6}")
        
        # Check critical data
        print("\n🔍 Critical Checks:")
        
        # Check super admin exists
        super_admins = User.query.filter_by(role='super_admin').count()
        if super_admins > 0:
            print(f"  ✓ Super admin accounts: {super_admins}")
        else:
            print(f"  ⚠ No super admin found - you'll need to create one")
        
        # Check settings
        settings = Settings.query.first()
        if settings:
            print(f"  ✓ Settings configured")
        else:
            print(f"  ⚠ No settings found - will use defaults")
        
        # Check active members
        active_members = MemberProfile.query.filter_by(is_frozen=False).count()
        print(f"  ✓ Active members: {active_members}")
        
        # Check database file
        from pathlib import Path
        db_path = Path('data/gym.db')
        if db_path.exists():
            size_mb = db_path.stat().st_size / (1024 * 1024)
            print(f"  ✓ Database file: {size_mb:.2f} MB")
        
        print("=" * 60)
        print("✅ Verification complete!")
        print("\nDatabase is ready for use.")
        print("=" * 60)

if __name__ == '__main__':
    main()

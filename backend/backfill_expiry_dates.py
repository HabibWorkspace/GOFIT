"""
Backfill missing package_expiry_date for members with active packages.

This script identifies members who have:
- current_package_id assigned
- package_start_date set
- BUT package_expiry_date is None

It then calculates and sets the correct expiry date based on the package duration.

IMPORTANT: Run this script AFTER deploying the check-in fix to clean up legacy data.
"""
from app import app
from database import db
from models import MemberProfile, Package, Transaction, TransactionStatus
from datetime import datetime, timedelta

def backfill_expiry_dates(dry_run=True):
    """
    Backfill missing package expiry dates.
    
    Args:
        dry_run (bool): If True, only show what would be changed without committing
    """
    with app.app_context():
        print("=" * 80)
        print("BACKFILL PACKAGE EXPIRY DATES")
        print("=" * 80)
        print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'LIVE (will update database)'}")
        print()
        
        # Find members with package but no expiry date
        members_to_fix = MemberProfile.query.filter(
            db.and_(
                MemberProfile.current_package_id.isnot(None),
                MemberProfile.package_expiry_date.is_(None)
            )
        ).all()
        
        print(f"Found {len(members_to_fix)} members with package but no expiry date")
        print()
        
        fixed_count = 0
        skipped_count = 0
        error_count = 0
        
        for member in members_to_fix:
            try:
                print(f"Processing: {member.full_name} (#{member.member_number})")
                print(f"  Current Package ID: {member.current_package_id}")
                print(f"  Package Start Date: {member.package_start_date}")
                
                # Get package details
                package = Package.query.get(member.current_package_id)
                if not package:
                    print(f"  ⚠️  SKIP: Package not found")
                    skipped_count += 1
                    continue
                
                print(f"  Package: {package.name} ({package.duration_days} days)")
                
                # Determine start date
                if member.package_start_date:
                    start_date = member.package_start_date
                else:
                    # Use most recent completed transaction date as fallback
                    recent_transaction = Transaction.query.filter(
                        db.and_(
                            Transaction.member_id == member.id,
                            Transaction.status == TransactionStatus.COMPLETED
                        )
                    ).order_by(Transaction.paid_date.desc()).first()
                    
                    if recent_transaction and recent_transaction.paid_date:
                        start_date = recent_transaction.paid_date
                        print(f"  ℹ️  Using transaction date as start: {start_date}")
                    else:
                        # Use admission date as last resort
                        if member.admission_date:
                            start_date = datetime.combine(member.admission_date, datetime.min.time())
                            print(f"  ℹ️  Using admission date as start: {start_date}")
                        else:
                            print(f"  ⚠️  SKIP: No start date available")
                            skipped_count += 1
                            continue
                
                # Calculate expiry date
                expiry_date = start_date + timedelta(days=package.duration_days)
                print(f"  Calculated Expiry: {expiry_date}")
                
                # Check if expired
                now = datetime.utcnow()
                if expiry_date < now:
                    days_expired = (now - expiry_date).days
                    print(f"  ⚠️  Package expired {days_expired} days ago")
                else:
                    days_remaining = (expiry_date - now).days
                    print(f"  ✓ Package valid ({days_remaining} days remaining)")
                
                if not dry_run:
                    # Update the member
                    if not member.package_start_date:
                        member.package_start_date = start_date
                    member.package_expiry_date = expiry_date
                    db.session.commit()
                    print(f"  ✅ UPDATED")
                else:
                    print(f"  ℹ️  Would update (dry run)")
                
                fixed_count += 1
                print()
                
            except Exception as e:
                print(f"  ❌ ERROR: {str(e)}")
                error_count += 1
                if not dry_run:
                    db.session.rollback()
                print()
        
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total members processed: {len(members_to_fix)}")
        print(f"Successfully fixed: {fixed_count}")
        print(f"Skipped: {skipped_count}")
        print(f"Errors: {error_count}")
        print()
        
        if dry_run:
            print("⚠️  This was a DRY RUN - no changes were made")
            print("To apply changes, run: python backfill_expiry_dates.py --live")
        else:
            print("✅ Changes have been committed to the database")
        
        print("=" * 80)


if __name__ == "__main__":
    import sys
    
    # Check for --live flag
    is_live = "--live" in sys.argv or "-l" in sys.argv
    
    if is_live:
        confirm = input("\n⚠️  WARNING: This will modify the database. Are you sure? (yes/no): ")
        if confirm.lower() != "yes":
            print("Aborted.")
            sys.exit(0)
    
    backfill_expiry_dates(dry_run=not is_live)

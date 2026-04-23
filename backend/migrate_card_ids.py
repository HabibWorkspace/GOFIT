"""Migrate member_number to card_id field."""
from database import db
from models.member_profile import MemberProfile
from app import app

def migrate_card_ids():
    """Copy member_number to card_id for all members."""
    with app.app_context():
        print("Starting card_id migration...")
        
        # Get all members
        members = MemberProfile.query.all()
        total = len(members)
        updated = 0
        
        print(f"Found {total} members to process")
        
        for member in members:
            if member.member_number and not member.card_id:
                # Convert member_number to string and assign to card_id
                member.card_id = str(member.member_number)
                updated += 1
                
                if updated % 50 == 0:
                    print(f"Processed {updated}/{total} members...")
        
        # Commit all changes
        try:
            db.session.commit()
            print(f"\n✓ Successfully migrated {updated} card IDs")
            print(f"✓ Total members: {total}")
            
            # Verify the migration
            print("\nVerifying migration...")
            sample_members = MemberProfile.query.limit(5).all()
            for m in sample_members:
                print(f"  Member {m.member_number}: card_id={m.card_id}")
                
        except Exception as e:
            db.session.rollback()
            print(f"\n✗ Error during migration: {e}")
            raise

if __name__ == '__main__':
    migrate_card_ids()

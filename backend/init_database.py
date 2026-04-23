"""
Initialize database - Create instance folder and database file.
"""

import os
import sys
from pathlib import Path

def create_instance_folder():
    """Create instance folder if it doesn't exist."""
    instance_path = Path(__file__).parent / 'instance'
    
    if not instance_path.exists():
        print("Creating instance folder...")
        instance_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {instance_path}")
    else:
        print(f"✓ Instance folder exists: {instance_path}")
    
    return instance_path

def initialize_database():
    """Initialize database with all tables."""
    print("\nInitializing database...")
    
    try:
        from app import create_app
        from database import db
        
        app, _ = create_app()
        
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✓ Database tables created")
            
            # Check tables
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"✓ Created {len(tables)} tables:")
            for table in sorted(tables):
                print(f"  - {table}")
            
            # Create default settings if not exists
            from models import Settings
            settings = Settings.query.first()
            if not settings:
                print("\nCreating default settings...")
                default_settings = Settings(
                    gym_name='GOFIT',
                    admission_fee=1000.0,
                    currency='PKR'
                )
                db.session.add(default_settings)
                db.session.commit()
                print("✓ Default settings created")
            else:
                print("\n✓ Settings already exist")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main initialization function."""
    print("=" * 70)
    print("DATABASE INITIALIZATION")
    print("=" * 70)
    print()
    
    # Step 1: Create instance folder
    instance_path = create_instance_folder()
    
    # Step 2: Initialize database
    if initialize_database():
        print()
        print("=" * 70)
        print("DATABASE INITIALIZED SUCCESSFULLY!")
        print("=" * 70)
        print()
        print("Next steps:")
        print("  1. Create admin: python quick_setup.py")
        print("  2. Start server: python start.py")
        print()
        return 0
    else:
        print()
        print("=" * 70)
        print("DATABASE INITIALIZATION FAILED")
        print("=" * 70)
        print()
        print("Please check the error above and try again.")
        print()
        return 1

if __name__ == '__main__':
    sys.exit(main())

"""
Import data from PythonAnywhere export to local SQLite database.
Run this on local Windows PC after copying gym_data_export.json.

Usage:
    python import_data.py

Input:
    gym_data_export.json - Data exported from PythonAnywhere
"""
import json
import sys
from datetime import datetime
from pathlib import Path

# Use local config
import config_local as config_module
sys.modules['config'] = config_module

from app import create_app
from database import db
from models import (
    User, MemberProfile, TrainerProfile, Package, Transaction,
    Attendance, BridgeHeartbeat, UnknownCard, Settings, AuditLog,
    TrainerMemberCharge, TrainerSalarySlip, Supplier, Supplement,
    SupplementStock, SupplementSale, GateCommand,
    UserRole, TransactionStatus, PaymentStatus, MovementType
)

def parse_datetime(value):
    """Parse ISO format datetime string."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', ''))
    except:
        return None

def parse_enum(enum_class, value):
    """Parse enum value."""
    if not value:
        return None
    try:
        return enum_class(value)
    except:
        return None

def import_table(model, records, name):
    """Import records into a table."""
    print(f"Importing {name}...")
    
    if not records:
        print(f"  ⊘ No records to import")
        return 0
    
    imported = 0
    for record_data in records:
        try:
            # Convert datetime strings
            for key, value in record_data.items():
                if isinstance(value, str) and ('_at' in key or '_date' in key or key == 'date_of_birth'):
                    record_data[key] = parse_datetime(value)
            
            # Convert enums
            if 'role' in record_data and model == User:
                record_data['role'] = parse_enum(UserRole, record_data['role'])
            elif 'status' in record_data and model == Transaction:
                record_data['status'] = parse_enum(TransactionStatus, record_data['status'])
            elif 'status' in record_data and (model == TrainerMemberCharge or model == TrainerSalarySlip):
                record_data['status'] = parse_enum(PaymentStatus, record_data['status'])
            elif 'movement_type' in record_data and model == SupplementStock:
                record_data['movement_type'] = parse_enum(MovementType, record_data['movement_type'])
            
            # Create record
            record = model(**record_data)
            db.session.add(record)
            imported += 1
            
        except Exception as e:
            print(f"  ✗ Error importing record: {e}")
            continue
    
    try:
        db.session.commit()
        print(f"  ✓ Imported {imported} records")
        return imported
    except Exception as e:
        db.session.rollback()
        print(f"  ✗ Error committing {name}: {e}")
        return 0

def main():
    """Import all data."""
    print("=" * 60)
    print("Gym Management System - Data Import")
    print("=" * 60)
    
    # Check if export file exists
    export_file = Path('gym_data_export.json')
    if not export_file.exists():
        print("❌ Error: gym_data_export.json not found")
        print("\nPlease:")
        print("1. Run export_data.py on PythonAnywhere")
        print("2. Download gym_data_export.json")
        print("3. Place it in C:\\gymapp\\")
        print("4. Run this script again")
        sys.exit(1)
    
    # Load export data
    print(f"📂 Loading {export_file}...")
    with open(export_file, 'r', encoding='utf-8') as f:
        export_data = json.load(f)
    
    print(f"📅 Export date: {export_data['export_date']}")
    print(f"📊 Tables: {len(export_data['tables'])}")
    
    # Create app and database
    app, _ = create_app()
    
    with app.app_context():
        # Create all tables
        print("\n🔨 Creating database tables...")
        db.create_all()
        print("  ✓ Tables created")
        
        # Import in correct order (respecting foreign keys)
        import_order = [
            (User, 'users'),
            (Settings, 'settings'),
            (Package, 'packages'),
            (TrainerProfile, 'trainer_profiles'),
            (MemberProfile, 'member_profiles'),
            (Transaction, 'transactions'),
            (Attendance, 'attendance'),
            (BridgeHeartbeat, 'bridge_heartbeat'),
            (UnknownCard, 'unknown_cards'),
            (AuditLog, 'audit_logs'),
            (TrainerMemberCharge, 'trainer_member_charges'),
            (TrainerSalarySlip, 'trainer_salary_slips'),
            (Supplier, 'suppliers'),
            (Supplement, 'supplements'),
            (SupplementStock, 'supplement_stock'),
            (SupplementSale, 'supplement_sales'),
            (GateCommand, 'gate_commands'),
        ]
        
        print("\n📥 Importing data...")
        total_imported = 0
        
        for model, name in import_order:
            records = export_data['tables'].get(name, [])
            imported = import_table(model, records, name)
            total_imported += imported
        
        print("=" * 60)
        print(f"✅ Import complete!")
        print(f"📝 Total records imported: {total_imported}")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Verify data: python verify_data.py")
        print("2. Start services: scripts\\install_services.bat")
        print("3. Test app: http://localhost:5000/api/health")

if __name__ == '__main__':
    main()

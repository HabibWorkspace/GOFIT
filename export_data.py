"""
Export all data from PythonAnywhere database to JSON.
Run this on PythonAnywhere before migration.

Usage:
    python export_data.py

Output:
    gym_data_export.json - Contains all database records
"""
import json
import sys
import os
from datetime import datetime

# Add backend directory to Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if os.path.exists(backend_dir):
    sys.path.insert(0, backend_dir)

from app import create_app
from database import db
from models import (
    User, MemberProfile, TrainerProfile, Package, Transaction,
    Attendance, BridgeHeartbeat, UnknownCard, Settings, AuditLog,
    TrainerMemberCharge, TrainerSalarySlip, Supplier, Supplement,
    SupplementStock, SupplementSale, GateCommand
)

def serialize_datetime(obj):
    """Convert datetime to ISO format string."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def export_table(model, name):
    """Export all records from a table."""
    print(f"Exporting {name}...")
    records = model.query.all()
    data = []
    
    for record in records:
        record_dict = {}
        for column in model.__table__.columns:
            value = getattr(record, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            elif hasattr(value, 'value'):  # Enum
                value = value.value
            record_dict[column.name] = value
        data.append(record_dict)
    
    print(f"  ✓ Exported {len(data)} records")
    return data

def main():
    """Export all data."""
    print("=" * 60)
    print("Gym Management System - Data Export")
    print("=" * 60)
    
    app, _ = create_app()
    
    with app.app_context():
        export_data = {
            'export_date': datetime.utcnow().isoformat(),
            'tables': {}
        }
        
        # Export all tables
        tables = [
            (User, 'users'),
            (MemberProfile, 'member_profiles'),
            (TrainerProfile, 'trainer_profiles'),
            (Package, 'packages'),
            (Transaction, 'transactions'),
            (Attendance, 'attendance'),
            (BridgeHeartbeat, 'bridge_heartbeat'),
            (UnknownCard, 'unknown_cards'),
            (Settings, 'settings'),
            (AuditLog, 'audit_logs'),
            (TrainerMemberCharge, 'trainer_member_charges'),
            (TrainerSalarySlip, 'trainer_salary_slips'),
            (Supplier, 'suppliers'),
            (Supplement, 'supplements'),
            (SupplementStock, 'supplement_stock'),
            (SupplementSale, 'supplement_sales'),
            (GateCommand, 'gate_commands'),
        ]
        
        for model, name in tables:
            try:
                export_data['tables'][name] = export_table(model, name)
            except Exception as e:
                print(f"  ✗ Error exporting {name}: {e}")
                export_data['tables'][name] = []
        
        # Save to file
        output_file = 'gym_data_export.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        print("=" * 60)
        print(f"✅ Export complete: {output_file}")
        print(f"📊 Total tables exported: {len(export_data['tables'])}")
        
        # Summary
        total_records = sum(len(records) for records in export_data['tables'].values())
        print(f"📝 Total records: {total_records}")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Download gym_data_export.json to your local PC")
        print("2. Place it in C:\\gymapp\\")
        print("3. Run: python import_data.py")

if __name__ == '__main__':
    main()

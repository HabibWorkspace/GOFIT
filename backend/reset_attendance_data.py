"""Reset all attendance data - clears attendance records, sync state, and daily summary."""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from database import db
from app import create_app
from models.attendance_record import AttendanceRecord
from models.sync_state import SyncState
from models.daily_attendance_summary import DailyAttendanceSummary


def reset_attendance_data():
    """Delete all attendance records, sync state, and daily summary data."""
    app, _ = create_app()
    
    with app.app_context():
        try:
            print("Resetting attendance data...")
            
            # Count records before deletion
            attendance_count = db.session.query(AttendanceRecord).count()
            sync_state_count = db.session.query(SyncState).count()
            daily_summary_count = db.session.query(DailyAttendanceSummary).count()
            
            print(f"\nFound:")
            print(f"  - {attendance_count} attendance records")
            print(f"  - {sync_state_count} sync state records")
            print(f"  - {daily_summary_count} daily summary records")
            
            # Ask for confirmation
            response = input("\nAre you sure you want to delete ALL attendance data? (yes/no): ")
            if response.lower() != 'yes':
                print("Operation cancelled.")
                return
            
            # Delete all records
            print("\nDeleting records...")
            db.session.query(AttendanceRecord).delete()
            db.session.query(SyncState).delete()
            db.session.query(DailyAttendanceSummary).delete()
            
            # Commit changes
            db.session.commit()
            
            print("\n✓ All attendance data has been reset successfully!")
            print(f"  - Deleted {attendance_count} attendance records")
            print(f"  - Deleted {sync_state_count} sync state records")
            print(f"  - Deleted {daily_summary_count} daily summary records")
            
        except Exception as e:
            print(f"\n✗ Error resetting attendance data: {str(e)}")
            db.session.rollback()
            raise


if __name__ == '__main__':
    reset_attendance_data()

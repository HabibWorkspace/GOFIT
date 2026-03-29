"""Database backup utility for production."""
import os
import shutil
from datetime import datetime
from pathlib import Path

def backup_database():
    """Create a backup of the SQLite database."""
    # Get database path
    db_path = Path(__file__).parent / 'instance' / 'fitnix.db'
    
    if not db_path.exists():
        print(f"❌ Database not found at: {db_path}")
        return False
    
    # Create backups directory
    backup_dir = Path(__file__).parent / 'backups'
    backup_dir.mkdir(exist_ok=True)
    
    # Generate backup filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f'fitnix_backup_{timestamp}.db'
    backup_path = backup_dir / backup_filename
    
    try:
        # Copy database file
        shutil.copy2(db_path, backup_path)
        
        # Get file size
        size_mb = backup_path.stat().st_size / (1024 * 1024)
        
        print(f"✅ Database backup created successfully!")
        print(f"   Location: {backup_path}")
        print(f"   Size: {size_mb:.2f} MB")
        
        # Clean up old backups (keep last 10)
        cleanup_old_backups(backup_dir, keep=10)
        
        return True
        
    except Exception as e:
        print(f"❌ Backup failed: {str(e)}")
        return False


def cleanup_old_backups(backup_dir, keep=10):
    """Remove old backup files, keeping only the most recent ones."""
    backups = sorted(backup_dir.glob('fitnix_backup_*.db'), key=lambda p: p.stat().st_mtime, reverse=True)
    
    if len(backups) > keep:
        removed_count = 0
        for old_backup in backups[keep:]:
            try:
                old_backup.unlink()
                removed_count += 1
            except Exception as e:
                print(f"⚠️  Could not remove old backup {old_backup.name}: {str(e)}")
        
        if removed_count > 0:
            print(f"🗑️  Removed {removed_count} old backup(s)")


def restore_database(backup_filename):
    """Restore database from a backup file."""
    backup_dir = Path(__file__).parent / 'backups'
    backup_path = backup_dir / backup_filename
    
    if not backup_path.exists():
        print(f"❌ Backup file not found: {backup_path}")
        return False
    
    db_path = Path(__file__).parent / 'instance' / 'fitnix.db'
    
    # Create backup of current database before restoring
    if db_path.exists():
        current_backup = db_path.parent / f'fitnix_before_restore_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
        shutil.copy2(db_path, current_backup)
        print(f"📦 Current database backed up to: {current_backup.name}")
    
    try:
        shutil.copy2(backup_path, db_path)
        print(f"✅ Database restored successfully from: {backup_filename}")
        return True
    except Exception as e:
        print(f"❌ Restore failed: {str(e)}")
        return False


def list_backups():
    """List all available backup files."""
    backup_dir = Path(__file__).parent / 'backups'
    
    if not backup_dir.exists():
        print("No backups directory found.")
        return
    
    backups = sorted(backup_dir.glob('fitnix_backup_*.db'), key=lambda p: p.stat().st_mtime, reverse=True)
    
    if not backups:
        print("No backup files found.")
        return
    
    print(f"\n📋 Available backups ({len(backups)}):")
    print("-" * 70)
    for i, backup in enumerate(backups, 1):
        size_mb = backup.stat().st_size / (1024 * 1024)
        mtime = datetime.fromtimestamp(backup.stat().st_mtime)
        print(f"{i}. {backup.name}")
        print(f"   Size: {size_mb:.2f} MB | Created: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 70)


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'backup':
            backup_database()
        elif command == 'list':
            list_backups()
        elif command == 'restore' and len(sys.argv) > 2:
            restore_database(sys.argv[2])
        else:
            print("Usage:")
            print("  python backup_database.py backup          - Create a new backup")
            print("  python backup_database.py list            - List all backups")
            print("  python backup_database.py restore <file>  - Restore from backup")
    else:
        # Default: create backup
        backup_database()

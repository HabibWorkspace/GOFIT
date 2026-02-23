"""Add profile_picture column to member_profiles table."""
import sqlite3
import os

# Get database path
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'fitnix.db')

print(f"Connecting to database: {db_path}")

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if column already exists
    cursor.execute("PRAGMA table_info(member_profiles)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'profile_picture' in columns:
        print("✓ Column 'profile_picture' already exists")
    else:
        # Add profile_picture column
        print("Adding profile_picture column...")
        cursor.execute("ALTER TABLE member_profiles ADD COLUMN profile_picture TEXT")
        conn.commit()
        print("✓ Successfully added profile_picture column")
    
    # Verify the column was added
    cursor.execute("PRAGMA table_info(member_profiles)")
    columns = cursor.fetchall()
    print("\nCurrent member_profiles columns:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
except Exception as e:
    print(f"✗ Error: {e}")
    conn.rollback()
finally:
    conn.close()

print("\nDone!")

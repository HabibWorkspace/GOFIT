"""Check production database schema."""
import psycopg2
import sys

# Production database URL
database_url = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

print("Connecting to production database...")

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Check if profile_picture column exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='member_profiles' AND column_name='profile_picture'
    """)
    
    if cursor.fetchone():
        print("✓ Column 'profile_picture' already exists")
    else:
        # Add profile_picture column
        print("Adding profile_picture column...")
        cursor.execute("ALTER TABLE member_profiles ADD COLUMN profile_picture TEXT")
        conn.commit()
        print("✓ Successfully added profile_picture column")
    
    # Verify the column was added
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name='member_profiles'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    
    print("\nMember Profiles Table Schema:")
    print("-" * 60)
    for col in columns:
        nullable = "NULL" if col[2] == 'YES' else "NOT NULL"
        print(f"  {col[0]:<25} {col[1]:<20} {nullable}")
    
    cursor.close()
    conn.close()
    print("\n✓ Done!")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()
    sys.exit(1)

"""Add profile_picture column to member_profiles table in production."""
import psycopg2

# Production database URL
database_url = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

print(f"Connecting to production database...")

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Check if column already exists
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
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name='member_profiles'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    print("\nCurrent member_profiles columns:")
    for col in columns:
        print(f"  - {col[0]} ({col[1]})")
    
    cursor.close()
    conn.close()
    print("\n✓ Done!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()

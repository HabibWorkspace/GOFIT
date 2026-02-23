"""
Script to fix the database by making CNIC and email optional
Run this once to apply the migration manually
"""
import psycopg2
import sys

# Your Render PostgreSQL connection string
DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

def fix_database():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Making CNIC column nullable...")
        cursor.execute("ALTER TABLE member_profiles ALTER COLUMN cnic DROP NOT NULL;")
        
        print("Making email column nullable...")
        cursor.execute("ALTER TABLE member_profiles ALTER COLUMN email DROP NOT NULL;")
        
        print("Dropping unique index on CNIC...")
        cursor.execute("DROP INDEX IF EXISTS ix_member_profiles_cnic;")
        
        print("Dropping unique index on email...")
        cursor.execute("DROP INDEX IF EXISTS ix_member_profiles_email;")
        
        print("Creating non-unique index on CNIC...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_member_profiles_cnic ON member_profiles(cnic);")
        
        print("Creating non-unique index on email...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_member_profiles_email ON member_profiles(email);")
        
        # Commit the changes
        conn.commit()
        
        print("\n✓ Database fixed successfully!")
        print("CNIC and email are now optional fields.")
        
        # Verify the changes
        print("\nVerifying changes...")
        cursor.execute("""
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'member_profiles' 
            AND column_name IN ('cnic', 'email');
        """)
        
        results = cursor.fetchall()
        print("\nColumn status:")
        for row in results:
            print(f"  {row[0]}: nullable={row[1]}, type={row[2]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_database()

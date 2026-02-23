"""
Script to make phone field optional in member_profiles
"""
import psycopg2

# Your Render PostgreSQL connection string
DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

def fix_phone():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Making phone column nullable...")
        cursor.execute("ALTER TABLE member_profiles ALTER COLUMN phone DROP NOT NULL;")
        
        print("Dropping unique constraint on phone...")
        cursor.execute("DROP INDEX IF EXISTS ix_member_profiles_phone;")
        
        print("Creating non-unique index on phone...")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_member_profiles_phone ON member_profiles(phone);")
        
        conn.commit()
        
        print("\n✓ Phone field is now optional!")
        
        # Verify
        cursor.execute("""
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'member_profiles' 
            AND column_name = 'phone';
        """)
        
        result = cursor.fetchone()
        print(f"\nPhone column: nullable={result[1]}, type={result[2]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")

if __name__ == "__main__":
    fix_phone()

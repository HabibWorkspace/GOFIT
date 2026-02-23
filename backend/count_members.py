"""
Count members in production database
"""
import psycopg2

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

def count_members():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Count total members
        cursor.execute("SELECT COUNT(*) FROM member_profiles;")
        total = cursor.fetchone()[0]
        print(f"\nTotal members in database: {total}")
        
        # Count members with phone
        cursor.execute("SELECT COUNT(*) FROM member_profiles WHERE phone IS NOT NULL;")
        with_phone = cursor.fetchone()[0]
        print(f"Members with phone: {with_phone}")
        
        # Count members without phone
        cursor.execute("SELECT COUNT(*) FROM member_profiles WHERE phone IS NULL;")
        without_phone = cursor.fetchone()[0]
        print(f"Members without phone: {without_phone}")
        
        # Show recent members
        print("\nRecent 10 members added:")
        cursor.execute("""
            SELECT full_name, phone, created_at 
            FROM member_profiles 
            ORDER BY created_at DESC 
            LIMIT 10;
        """)
        
        for row in cursor.fetchall():
            name, phone, created = row
            phone_str = phone if phone else "No phone"
            print(f"  - {name} ({phone_str}) - {created}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    count_members()

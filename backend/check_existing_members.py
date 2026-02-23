"""
Check which members from the list already exist
"""
import psycopg2

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

# All members from the Excel file
all_members = [
    {"name": "Shan", "phone": "3410562971"},
    {"name": "Mustufa Asif", "phone": "3146690573"},
    {"name": "Yameen Ali Shah", "phone": "3413362279"},
    {"name": "Nafees Haider", "phone": "3394004129"},
    {"name": "Saim", "phone": "3273736928"},
    {"name": "Muhammad Shahbaz", "phone": "3412502867"},
    {"name": "Muhammad Hamza", "phone": "3432255395"},
    {"name": "Shariq Ali", "phone": "3402322556"},
    {"name": "Taha Khan", "phone": "3190014408"},
    {"name": "Muhammad Shah Fahad", "phone": "3472905023"},
    {"name": "Syed Mubashir", "phone": "3042003786"},
    {"name": "Saif Shams", "phone": "3142375604"},
    {"name": "Azmat Ansari", "phone": "3432618836"},
    {"name": "Owais Baare", "phone": "3161624908"},
]

def check_members():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("\nChecking which members exist:")
        existing = 0
        missing = 0
        
        for member in all_members:
            cursor.execute("SELECT full_name FROM member_profiles WHERE phone = %s", (member["phone"],))
            result = cursor.fetchone()
            if result:
                print(f"  ✓ EXISTS: {member['name']} ({member['phone']})")
                existing += 1
            else:
                print(f"  ✗ MISSING: {member['name']} ({member['phone']})")
                missing += 1
        
        print(f"\nExisting: {existing}")
        print(f"Missing: {missing}")
        
        # Show all members in database
        print("\n\nAll members currently in database:")
        cursor.execute("SELECT full_name, phone FROM member_profiles ORDER BY full_name;")
        for row in cursor.fetchall():
            name, phone = row
            phone_str = phone if phone else "No phone"
            print(f"  - {name} ({phone_str})")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_members()

"""
Add the remaining members without phone numbers
"""
import psycopg2
from datetime import datetime, timedelta
import uuid

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

# Members without phone numbers
members_data = [
    {"name": "Sharjeel", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Muhammad Ashal Abbas", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Talha", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Iqra", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Inayat Ullah", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Khalid Bhai", "phone": None, "package": "Cardio", "trainer": None},
    {"name": "Maham", "phone": None, "package": "Aerobic", "trainer": None},
    {"name": "Kashif Bhai", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Sana", "phone": None, "package": "Combo III", "trainer": None},
    {"name": "Shahbaz Muhammad Ullah Khan", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Abdul Rafay", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Iqra Saleem", "phone": None, "package": "Aerobic", "trainer": None},
]

def get_package_id(cursor, package_name):
    cursor.execute("SELECT id FROM packages WHERE name = %s", (package_name,))
    result = cursor.fetchone()
    return result[0] if result else None

def add_members():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Get package IDs
        packages = {}
        for pkg_name in ["Basic", "Cardio", "Combo I", "Combo III", "Aerobic"]:
            pkg_id = get_package_id(cursor, pkg_name)
            if pkg_id:
                packages[pkg_name] = pkg_id
        
        print(f"\nAdding {len(members_data)} members without phone numbers...")
        
        added = 0
        
        for member in members_data:
            try:
                # Create user account
                user_id = str(uuid.uuid4())
                username = f"member_{uuid.uuid4().hex[:8]}"
                
                cursor.execute("""
                    INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, 'MEMBER', TRUE, %s, %s)
                """, (
                    user_id,
                    username,
                    "placeholder",
                    datetime.now(),
                    datetime.now()
                ))
                
                # Create member profile
                member_id = str(uuid.uuid4())
                package_id = packages.get(member["package"])
                
                admission_date = datetime.now()
                package_start_date = admission_date if package_id else None
                package_expiry_date = None
                if package_start_date:
                    package_expiry_date = package_start_date + timedelta(days=30)
                
                cursor.execute("""
                    INSERT INTO member_profiles (
                        id, user_id, full_name, phone, cnic, email,
                        admission_date, admission_fee_paid,
                        current_package_id, trainer_id,
                        package_start_date, package_expiry_date,
                        is_frozen, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    member_id,
                    user_id,
                    member["name"],
                    None,  # phone is now optional
                    None,  # CNIC is optional
                    None,  # Email is optional
                    admission_date,
                    False,
                    package_id,
                    None,  # trainer_id
                    package_start_date,
                    package_expiry_date,
                    False,
                    datetime.now(),
                    datetime.now()
                ))
                
                print(f"  ✓ Added {member['name']} - {member['package']}")
                added += 1
                
            except Exception as e:
                print(f"  ✗ Error adding {member['name']}: {e}")
                conn.rollback()
                continue
        
        conn.commit()
        print(f"\n✓ Successfully added {added} members")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    add_members()

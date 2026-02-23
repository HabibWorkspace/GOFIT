"""Add all missing members"""
import psycopg2
from datetime import datetime, timedelta
import uuid

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

def get_package_id(cursor, package_name):
    cursor.execute("SELECT id FROM packages WHERE name = %s", (package_name,))
    result = cursor.fetchone()
    return result[0] if result else None

def get_trainer_id(cursor, trainer_name):
    if not trainer_name:
        return None
    cursor.execute("SELECT id FROM trainer_profiles WHERE full_name ILIKE %s", (f"%{trainer_name}%",))
    result = cursor.fetchone()
    return result[0] if result else None

def add_member(cursor, member, packages, trainers):
    user_id = str(uuid.uuid4())
    username = member["phone"] if member["phone"] else f"member_{uuid.uuid4().hex[:8]}"
    
    cursor.execute("""
        INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
        VALUES (%s, %s, 'placeholder', 'MEMBER', TRUE, %s, %s)
    """, (user_id, username, datetime.now(), datetime.now()))
    
    member_id = str(uuid.uuid4())
    package_id = packages.get(member["package"])
    trainer_id = trainers.get(member["trainer"]) if member["trainer"] else None
    
    admission_date = datetime.now()
    package_start_date = admission_date if package_id else None
    package_expiry_date = package_start_date + timedelta(days=30) if package_start_date else None
    
    cursor.execute("""
        INSERT INTO member_profiles (
            id, user_id, full_name, phone, cnic, email,
            admission_date, admission_fee_paid,
            current_package_id, trainer_id,
            package_start_date, package_expiry_date,
            is_frozen, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        member_id, user_id, member["name"], member["phone"], None, None,
        admission_date, False, package_id, trainer_id,
        package_start_date, package_expiry_date, False,
        datetime.now(), datetime.now()
    ))

print("Starting...")

# Member data - part 1
members_part1 = [
    {"name": "Muhammad Shahbaz", "phone": "3412502867", "package": "Combo I", "trainer": None},
    {"name": "Azmat Ansari", "phone": "3432618836", "package": "Basic", "trainer": None},
    {"name": "Wasif Khan", "phone": "3132508891", "package": "Basic", "trainer": None},
    {"name": "Shakib Alam", "phone": "3402575417", "package": "Basic", "trainer": None},
    {"name": "Kashif Rafique", "phone": "3412465476", "package": "Basic", "trainer": None},
    {"name": "Muhammad Anus", "phone": "3120292150", "package": "Basic", "trainer": None},
    {"name": "Iqhlaq", "phone": "3342213359", "package": "Basic", "trainer": None},
    {"name": "Sheraz", "phone": "3342213359", "package": "Basic", "trainer": None},
    {"name": "Sajid Khan", "phone": "3111413908", "package": "Basic", "trainer": "Ali"},
    {"name": "Muhammad Naseem", "phone": "3082100071", "package": "Basic", "trainer": "Ali"},
    {"name": "Rayed Ibrahim", "phone": "3142318894", "package": "Basic", "trainer": None},
    {"name": "Adnan Hashim", "phone": "3193921084", "package": "Basic", "trainer": None},
    {"name": "Ahan Jamil", "phone": "3003484634", "package": "Basic", "trainer": None},
    {"name": "Farhan", "phone": "3323333333", "package": "Basic", "trainer": "Mustafa"},
    {"name": "Sarim", "phone": "3343914636", "package": "Basic", "trainer": None},
    {"name": "Shazil", "phone": "314207886", "package": "Basic", "trainer": None},
    {"name": "Talha Zeeshan", "phone": "3190295040", "package": "Basic", "trainer": None},
    {"name": "Wajahat Khan", "phone": "3484676229", "package": "Combo I", "trainer": None},
    {"name": "Nabeel Hussain", "phone": "3278271912", "package": "Basic", "trainer": None},
    {"name": "Abdullah", "phone": "3161457037", "package": "Basic", "trainer": None},
]

# Member data - part 2
members_part2 = [
    {"name": "Kashan", "phone": "3242701599", "package": "Basic", "trainer": None},
    {"name": "Muhammad Zohaib", "phone": "3333022337", "package": "Basic", "trainer": None},
    {"name": "Amir Khan", "phone": "3152164175", "package": "Basic", "trainer": None},
    {"name": "Muhammad Umar", "phone": "3193666724", "package": "Basic", "trainer": None},
    {"name": "Syed Raheel", "phone": "3703077822", "package": "Basic", "trainer": None},
    {"name": "Muhammad Ifran Sheikh", "phone": "3182741980", "package": "Basic", "trainer": None},
    {"name": "Erum Fatima", "phone": "3131234567", "package": "Combo III", "trainer": None},
    {"name": "Rayyan Arif", "phone": "3231405800", "package": "Basic", "trainer": None},
    {"name": "Muhammad Zaki Shakeel", "phone": "3194942753", "package": "Basic", "trainer": None},
    {"name": "Hanzala", "phone": "3182963938", "package": "Basic", "trainer": None},
    {"name": "Shehroz Ghani", "phone": "3302129222", "package": "Basic", "trainer": None},
    {"name": "Daniyal Ahmed", "phone": "3368004094", "package": "Basic", "trainer": None},
    {"name": "Anas Hussain", "phone": "3182305862", "package": "Basic", "trainer": None},
    {"name": "Mubbashir Ishtiaq", "phone": "3172168321", "package": "Cardio", "trainer": None},
    {"name": "Muhammad Ahmed", "phone": "3368232689", "package": "Basic", "trainer": None},
    {"name": "Muhammad Humza Ali", "phone": "3404534479", "package": "Basic", "trainer": None},
    {"name": "Amreen Amir", "phone": "3131254050", "package": "Basic", "trainer": None},
    {"name": "Abdullah Nizamuddin", "phone": "3162247840", "package": "Basic", "trainer": None},
    {"name": "Umer", "phone": "3700940275", "package": "Basic", "trainer": None},
    {"name": "Arham", "phone": "3168057084", "package": "Basic", "trainer": None},
]

# Member data - part 3
members_part3 = [
    {"name": "Affan Mustufa", "phone": "3122724073", "package": "Basic", "trainer": None},
    {"name": "Sabih", "phone": "3282617055", "package": "Basic", "trainer": None},
    {"name": "Zayan Ur Rehman", "phone": "3181200045", "package": "Basic", "trainer": "Ali"},
    {"name": "Sami Umer Khan", "phone": "3120801757", "package": "Basic", "trainer": "Ali"},
    {"name": "Saeed Shafiq", "phone": "3152850091", "package": "Basic", "trainer": "Ali"},
    {"name": "Hamza Khursheed", "phone": "3122582248", "package": "Basic", "trainer": None},
    {"name": "Muhammad Umer Maqsood", "phone": "3343683979", "package": "Basic", "trainer": None},
    {"name": "Muhammad Ahmed", "phone": "3182989997", "package": "Basic", "trainer": "Ali"},
    {"name": "Salman Khan", "phone": "3122096984", "package": "Basic", "trainer": None},
    {"name": "Nabeel Akhtar", "phone": "3102705063", "package": "Basic", "trainer": None},
    {"name": "Talha Moin", "phone": "3102705063", "package": "Basic", "trainer": None},
    {"name": "Mavia Adil", "phone": "3453121531", "package": "Basic", "trainer": None},
    {"name": "Arooj", "phone": "3181182878", "package": "Combo III", "trainer": None},
    {"name": "Muhammad Aqib", "phone": "3400065589", "package": "Basic", "trainer": None},
    {"name": "Muhammad Ammar", "phone": "3491819036", "package": "Basic", "trainer": None},
    {"name": "Hamza Alam", "phone": "3132067962", "package": "Basic", "trainer": None},
    {"name": "Arsalan Tahir", "phone": "3408312014", "package": "Basic", "trainer": None},
    {"name": "Saad Malik", "phone": "3408312014", "package": "Basic", "trainer": None},
    {"name": "Wahid Bin Khalid", "phone": "3112507149", "package": "Basic", "trainer": None},
    {"name": "Mubbashir", "phone": "3082276097", "package": "Basic", "trainer": None},
]

# Member data - part 4
members_part4 = [
    {"name": "Uzair Alam", "phone": "3702095563", "package": "Basic", "trainer": None},
    {"name": "Ali", "phone": "3121161845", "package": "Basic", "trainer": None},
    {"name": "Bassam", "phone": "3121161845", "package": "Basic", "trainer": None},
    {"name": "Muhammad Sufiyan", "phone": "319812867", "package": "Basic", "trainer": None},
    {"name": "Ahmed", "phone": "3462858293", "package": "Basic", "trainer": None},
    {"name": "Maaz", "phone": "3173974017", "package": "Basic", "trainer": None},
    {"name": "Hanzala Shakeel", "phone": "3193661984", "package": "Basic", "trainer": None},
    {"name": "Ali Hameed", "phone": "3322790277", "package": "Basic", "trainer": None},
    {"name": "Muhammad Qasim", "phone": "345233130", "package": "Basic", "trainer": None},
    {"name": "Kashif Raza", "phone": "3162350910", "package": "Basic", "trainer": None},
    {"name": "Huzaifa", "phone": "3302732730", "package": "Basic", "trainer": None},
    {"name": "Daniyal", "phone": "3132281136", "package": "Basic", "trainer": None},
    {"name": "Sufyan Sheikh", "phone": "3152070306", "package": "Basic", "trainer": None},
    {"name": "Hasnain", "phone": "3282617055", "package": "Basic", "trainer": None},
    {"name": "Shezad Arshad", "phone": "3442394552", "package": "Basic", "trainer": None},
    {"name": "Muhammad Shabbir", "phone": "3472576441", "package": "Basic", "trainer": "Ali"},
    {"name": "Muhammad Zubair", "phone": "3198132746", "package": "Basic", "trainer": None},
    {"name": "Muhammad Ali", "phone": "3122673154", "package": "Basic", "trainer": None},
    {"name": "Abdullah", "phone": "3368258702", "package": "Basic", "trainer": None},
    {"name": "Faisal Shah", "phone": "3160255149", "package": "Basic", "trainer": None},
    {"name": "Arsalan Ali", "phone": "3110815728", "package": "Basic", "trainer": "Ali"},
    {"name": "Zain ul Abdeen", "phone": "3131005877", "package": "Basic", "trainer": None},
    {"name": "Rabi", "phone": "3103087873", "package": "Basic", "trainer": None},
    {"name": "Hammad", "phone": "3198590729", "package": "Basic", "trainer": None},
    {"name": "Hassan Zubair", "phone": "3283451067", "package": "Basic", "trainer": None},
    {"name": "Sher Bano", "phone": "3401240778", "package": "Combo III", "trainer": None},
    {"name": "Muhammad Zaid Khan", "phone": "3453029638", "package": "Basic", "trainer": None},
    {"name": "Sarwar", "phone": "3002032856", "package": "Basic", "trainer": None},
    {"name": "Sufiyan", "phone": "3108316422", "package": "Basic", "trainer": None},
    {"name": "Huzaifa", "phone": "3408592211", "package": "Basic", "trainer": None},
    {"name": "Adeel", "phone": "3192116141", "package": "Basic", "trainer": None},
    {"name": "Affan", "phone": "3152425083", "package": "Basic", "trainer": None},
]

all_members = members_part1 + members_part2 + members_part3 + members_part4


try:
    print("Connecting...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Get existing names
    cursor.execute("SELECT LOWER(full_name) FROM member_profiles;")
    existing_names = set(row[0] for row in cursor.fetchall())
    
    # Get packages
    packages = {}
    for pkg in ["Basic", "Cardio", "Combo I", "Combo III", "Aerobic"]:
        pkg_id = get_package_id(cursor, pkg)
        if pkg_id:
            packages[pkg] = pkg_id
    
    # Get trainers
    trainers = {}
    for t in ["Ali", "Mustafa"]:
        t_id = get_trainer_id(cursor, t)
        if t_id:
            trainers[t] = t_id
    
    print(f"Adding {len(all_members)} members...")
    added = 0
    skipped = 0
    
    for member in all_members:
        if member["name"].lower() in existing_names:
            skipped += 1
            continue
        
        try:
            add_member(cursor, member, packages, trainers)
            print(f"✓ {member['name']}")
            added += 1
        except Exception as e:
            print(f"✗ {member['name']}: {str(e)[:50]}")
            conn.rollback()
            cursor = conn.cursor()
    
    conn.commit()
    print(f"\nAdded: {added}, Skipped: {skipped}")
    
    cursor.execute("SELECT COUNT(*) FROM member_profiles;")
    print(f"Total in database: {cursor.fetchone()[0]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

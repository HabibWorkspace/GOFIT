"""
Find which members are truly missing from the database
"""
import psycopg2

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

# All 116 members from Excel
all_members = [
    {"name": "Shan", "phone": "3410562971", "package": "Basic", "trainer": None},
    {"name": "Mustufa Asif", "phone": "3146690573", "package": "Basic", "trainer": None},
    {"name": "Yameen Ali Shah", "phone": "3413362279", "package": "Basic", "trainer": None},
    {"name": "Nafees Haider", "phone": "3394004129", "package": "Basic", "trainer": None},
    {"name": "Saim", "phone": "3273736928", "package": "Cardio", "trainer": None},
    {"name": "Muhammad Shahbaz", "phone": "3412502867", "package": "Combo I", "trainer": None},
    {"name": "Muhammad Hamza", "phone": "3432255395", "package": "Basic", "trainer": None},
    {"name": "Shariq Ali", "phone": "3402322556", "package": "Basic", "trainer": None},
    {"name": "Taha Khan", "phone": "3190014408", "package": "Basic", "trainer": None},
    {"name": "Muhammad Shah Fahad", "phone": "3472905023", "package": "Combo I", "trainer": None},
    {"name": "Syed Mubashir", "phone": "3042003786", "package": "Combo I", "trainer": None},
    {"name": "Saif Shams", "phone": "3142375604", "package": "Basic", "trainer": None},
    {"name": "Azmat Ansari", "phone": "3432618836", "package": "Basic", "trainer": None},
    {"name": "Owais Baare", "phone": "3161624908", "package": "Basic", "trainer": None},
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
    {"name": "Kashan", "phone": "3242701599", "package": "Basic", "trainer": None},
    {"name": "Muhammad Zohaib", "phone": "3333022337", "package": "Basic", "trainer": None},
    {"name": "Sharjeel", "phone": None, "package": "Basic", "trainer": None},
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
    {"name": "Muhammad Ashal Abbas", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Mubbashir Ishtiaq", "phone": "3172168321", "package": "Cardio", "trainer": None},
    {"name": "Muhammad Ahmed", "phone": "3368232689", "package": "Basic", "trainer": None},
    {"name": "Muhammad Humza Ali", "phone": "3404534479", "package": "Basic", "trainer": None},
    {"name": "Amreen Amir", "phone": "3131254050", "package": "Basic", "trainer": None},
    {"name": "Abdullah Nizamuddin", "phone": "3162247840", "package": "Basic", "trainer": None},
    {"name": "Umer", "phone": "3700940275", "package": "Basic", "trainer": None},
    {"name": "Arham", "phone": "3168057084", "package": "Basic", "trainer": None},
    {"name": "Affan Mustufa", "phone": "3122724073", "package": "Basic", "trainer": None},
    {"name": "Sabih", "phone": "3282617055", "package": "Basic", "trainer": None},
    {"name": "Talha", "phone": None, "package": "Basic", "trainer": None},
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
    {"name": "Iqra", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Muhammad Aqib", "phone": "3400065589", "package": "Basic", "trainer": None},
    {"name": "Muhammad Ammar", "phone": "3491819036", "package": "Basic", "trainer": None},
    {"name": "Hamza Alam", "phone": "3132067962", "package": "Basic", "trainer": None},
    {"name": "Arsalan Tahir", "phone": "3408312014", "package": "Basic", "trainer": None},
    {"name": "Saad Malik", "phone": "3408312014", "package": "Basic", "trainer": None},
    {"name": "Wahid Bin Khalid", "phone": "3112507149", "package": "Basic", "trainer": None},
    {"name": "Inayat Ullah", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Khalid Bhai", "phone": None, "package": "Cardio", "trainer": None},
    {"name": "Mubbashir", "phone": "3082276097", "package": "Basic", "trainer": None},
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
    {"name": "Maham", "phone": None, "package": "Aerobic", "trainer": None},
    {"name": "Hasnain", "phone": "3282617055", "package": "Basic", "trainer": None},
    {"name": "Shezad Arshad", "phone": "3442394552", "package": "Basic", "trainer": None},
    {"name": "Muhammad Shabbir", "phone": "3472576441", "package": "Basic", "trainer": "Ali"},
    {"name": "Muhammad Zubair", "phone": "3198132746", "package": "Basic", "trainer": None},
    {"name": "Muhammad Ali", "phone": "3122673154", "package": "Basic", "trainer": None},
    {"name": "Kashif Bhai", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Sana", "phone": None, "package": "Combo III", "trainer": None},
    {"name": "Abdullah", "phone": "3368258702", "package": "Basic", "trainer": None},
    {"name": "Faisal Shah", "phone": "3160255149", "package": "Basic", "trainer": None},
    {"name": "Shahbaz Muhammad Ullah Khan", "phone": None, "package": "Basic", "trainer": None},
    {"name": "Abdul Rafay", "phone": None, "package": "Basic", "trainer": None},
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
    {"name": "Iqra Saleem", "phone": None, "package": "Aerobic", "trainer": None},
]

def find_missing():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Get all existing member names
        cursor.execute("SELECT LOWER(full_name) FROM member_profiles;")
        existing_names = set(row[0] for row in cursor.fetchall())
        
        print(f"\nFound {len(existing_names)} members in database")
        print(f"Checking {len(all_members)} members from Excel...\n")
        
        missing = []
        existing = []
        
        for member in all_members:
            name_lower = member["name"].lower()
            if name_lower in existing_names:
                existing.append(member)
            else:
                missing.append(member)
        
        print(f"✓ Already in database: {len(existing)}")
        print(f"✗ Missing from database: {len(missing)}")
        
        if missing:
            print("\nMissing members:")
            for m in missing:
                phone_str = m["phone"] if m["phone"] else "No phone"
                print(f"  - {m['name']} ({phone_str})")
        
        cursor.close()
        conn.close()
        
        return missing
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    find_missing()

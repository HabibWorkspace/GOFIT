"""Find which members are still missing"""
import psycopg2

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

# All 116 members from Excel
all_116_members = [
    "Shan", "Mustufa Asif", "Yameen Ali Shah", "Nafees Haider", "Saim",
    "Muhammad Shahbaz", "Muhammad Hamza", "Shariq Ali", "Taha Khan",
    "Muhammad Shah Fahad", "Syed Mubashir", "Saif Shams", "Azmat Ansari",
    "Owais Baare", "Wasif Khan", "Shakib Alam", "Kashif Rafique",
    "Muhammad Anus", "Iqhlaq", "Sheraz", "Sajid Khan", "Muhammad Naseem",
    "Rayed Ibrahim", "Adnan Hashim", "Ahan Jamil", "Farhan", "Sarim",
    "Shazil", "Talha Zeeshan", "Wajahat Khan", "Nabeel Hussain", "Abdullah",
    "Kashan", "Muhammad Zohaib", "Sharjeel", "Amir Khan", "Muhammad Umar",
    "Syed Raheel", "Muhammad Ifran Sheikh", "Erum Fatima", "Rayyan Arif",
    "Muhammad Zaki Shakeel", "Hanzala", "Shehroz Ghani", "Daniyal Ahmed",
    "Anas Hussain", "Muhammad Ashal Abbas", "Mubbashir Ishtiaq",
    "Muhammad Ahmed", "Muhammad Humza Ali", "Amreen Amir",
    "Abdullah Nizamuddin", "Umer", "Arham", "Affan Mustufa", "Sabih",
    "Talha", "Zayan Ur Rehman", "Sami Umer Khan", "Saeed Shafiq",
    "Hamza Khursheed", "Muhammad Umer Maqsood", "Muhammad Ahmed",
    "Salman Khan", "Nabeel Akhtar", "Talha Moin", "Mavia Adil", "Arooj",
    "Iqra", "Muhammad Aqib", "Muhammad Ammar", "Hamza Alam",
    "Arsalan Tahir", "Saad Malik", "Wahid Bin Khalid", "Inayat Ullah",
    "Khalid Bhai", "Mubbashir", "Uzair Alam", "Ali", "Bassam",
    "Muhammad Sufiyan", "Ahmed", "Maaz", "Hanzala Shakeel", "Ali Hameed",
    "Muhammad Qasim", "Kashif Raza", "Huzaifa", "Daniyal", "Sufyan Sheikh",
    "Maham", "Hasnain", "Shezad Arshad", "Muhammad Shabbir",
    "Muhammad Zubair", "Muhammad Ali", "Kashif Bhai", "Sana", "Abdullah",
    "Faisal Shah", "Shahbaz Muhammad Ullah Khan", "Abdul Rafay",
    "Arsalan Ali", "Zain ul Abdeen", "Rabi", "Hammad", "Hassan Zubair",
    "Sher Bano", "Muhammad Zaid Khan", "Sarwar", "Sufiyan", "Huzaifa",
    "Adeel", "Affan", "Iqra Saleem"
]

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

cursor.execute("SELECT LOWER(full_name) FROM member_profiles;")
existing = set(row[0] for row in cursor.fetchall())

print(f"Total in Excel: {len(all_116_members)}")
print(f"Total in database: {len(existing)}")

missing = []
for name in all_116_members:
    if name.lower() not in existing:
        missing.append(name)

print(f"\nMissing: {len(missing)}")
if missing:
    print("\nMissing members:")
    for m in missing:
        print(f"  - {m}")

# Check for duplicates in Excel list
from collections import Counter
counts = Counter([n.lower() for n in all_116_members])
duplicates = {name: count for name, count in counts.items() if count > 1}
if duplicates:
    print(f"\nDuplicates in Excel list:")
    for name, count in duplicates.items():
        print(f"  - {name}: {count} times")

cursor.close()
conn.close()

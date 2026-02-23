"""Verify all members in database"""
import psycopg2

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM member_profiles;")
total = cursor.fetchone()[0]
print(f"Total members: {total}")

cursor.execute("SELECT full_name, phone FROM member_profiles ORDER BY created_at DESC LIMIT 30;")
print("\nLast 30 members added:")
for row in cursor.fetchall():
    name, phone = row
    phone_str = phone if phone else "No phone"
    print(f"  - {name} ({phone_str})")

cursor.close()
conn.close()

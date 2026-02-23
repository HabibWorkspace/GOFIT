"""Count transactions in production database"""
import psycopg2

DATABASE_URL = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM transactions;")
total_transactions = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM member_profiles;")
total_members = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(DISTINCT member_id) FROM transactions;")
members_with_transactions = cursor.fetchone()[0]

print(f"Total members: {total_members}")
print(f"Total transactions: {total_transactions}")
print(f"Members with transactions: {members_with_transactions}")
print(f"Members without transactions: {total_members - members_with_transactions}")

cursor.close()
conn.close()

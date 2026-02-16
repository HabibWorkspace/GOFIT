"""Assign member_numbers to all existing members in production starting from 10."""
import psycopg2

# Production database URL
database_url = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

print("Connecting to production database...")

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Get all members without member_number or with NULL member_number
    cursor.execute("""
        SELECT id, full_name 
        FROM member_profiles 
        WHERE member_number IS NULL 
        ORDER BY created_at ASC
    """)
    members = cursor.fetchall()
    
    if not members:
        print("✓ All members already have member_numbers assigned")
    else:
        print(f"Found {len(members)} members without member_numbers")
        
        # Start from 10
        next_number = 10
        
        # Assign member_numbers
        for member_id, full_name in members:
            cursor.execute("""
                UPDATE member_profiles 
                SET member_number = %s 
                WHERE id = %s
            """, (next_number, member_id))
            print(f"  Assigned #{next_number} to {full_name}")
            next_number += 1
        
        conn.commit()
        print(f"\n✓ Successfully assigned member_numbers to {len(members)} members")
    
    # Show all members with their numbers
    cursor.execute("""
        SELECT member_number, full_name, phone 
        FROM member_profiles 
        ORDER BY member_number ASC
    """)
    all_members = cursor.fetchall()
    
    print(f"\nAll members ({len(all_members)}):")
    print("-" * 60)
    for num, name, phone in all_members:
        print(f"  #{num:<5} {name:<30} {phone}")
    
    cursor.close()
    conn.close()
    print("\n✓ Done!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    if 'conn' in locals():
        conn.rollback()
        conn.close()

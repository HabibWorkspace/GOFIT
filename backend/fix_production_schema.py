"""Fix production database schema - Add all missing columns."""
import psycopg2
import sys

# Production database URL
database_url = "postgresql://fitcore:GNkzm2BnBeSUZTlI4mCyt1ZWowrI6TLH@dpg-d67peli48b3s73a6svrg-a.oregon-postgres.render.com/fitcore"

print("Connecting to production database...")

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("CHECKING AND FIXING PRODUCTION DATABASE SCHEMA")
    print("="*60)
    
    # 1. Check and add profile_picture column
    print("\n1. Checking profile_picture column...")
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='member_profiles' AND column_name='profile_picture'
    """)
    
    if cursor.fetchone():
        print("   ✓ Column 'profile_picture' already exists")
    else:
        print("   Adding profile_picture column...")
        cursor.execute("ALTER TABLE member_profiles ADD COLUMN profile_picture TEXT")
        conn.commit()
        print("   ✓ Successfully added profile_picture column")
    
    # 2. Check and add member_number column
    print("\n2. Checking member_number column...")
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='member_profiles' AND column_name='member_number'
    """)
    
    if cursor.fetchone():
        print("   ✓ Column 'member_number' already exists")
    else:
        print("   Adding member_number column...")
        cursor.execute("ALTER TABLE member_profiles ADD COLUMN member_number INTEGER UNIQUE")
        conn.commit()
        print("   ✓ Successfully added member_number column")
    
    # 3. Check and add is_frozen column
    print("\n3. Checking is_frozen column...")
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='member_profiles' AND column_name='is_frozen'
    """)
    
    if cursor.fetchone():
        print("   ✓ Column 'is_frozen' already exists")
    else:
        print("   Adding is_frozen column...")
        cursor.execute("ALTER TABLE member_profiles ADD COLUMN is_frozen BOOLEAN DEFAULT FALSE NOT NULL")
        conn.commit()
        print("   ✓ Successfully added is_frozen column")
    
    # 4. Check and fix nullable constraints on cnic, email, phone
    print("\n4. Checking nullable constraints...")
    cursor.execute("""
        SELECT column_name, is_nullable
        FROM information_schema.columns 
        WHERE table_name='member_profiles' AND column_name IN ('cnic', 'email', 'phone')
    """)
    
    nullable_cols = cursor.fetchall()
    for col_name, is_nullable in nullable_cols:
        if is_nullable == 'NO':
            print(f"   Making {col_name} nullable...")
            cursor.execute(f"ALTER TABLE member_profiles ALTER COLUMN {col_name} DROP NOT NULL")
            conn.commit()
            print(f"   ✓ {col_name} is now nullable")
        else:
            print(f"   ✓ {col_name} is already nullable")
    
    # 5. Check and add transaction columns (trainer_fee, package_price, discount_amount, discount_type)
    print("\n5. Checking transaction table columns...")
    
    transaction_columns = [
        ('trainer_fee', 'NUMERIC(10, 2) DEFAULT 0'),
        ('package_price', 'NUMERIC(10, 2) DEFAULT 0'),
        ('discount_amount', 'NUMERIC(10, 2) DEFAULT 0'),
        ('discount_type', "VARCHAR(20) DEFAULT 'fixed'")
    ]
    
    for col_name, col_type in transaction_columns:
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='transactions' AND column_name='{col_name}'
        """)
        
        if cursor.fetchone():
            print(f"   ✓ Column '{col_name}' already exists")
        else:
            print(f"   Adding {col_name} column...")
            cursor.execute(f"ALTER TABLE transactions ADD COLUMN {col_name} {col_type}")
            conn.commit()
            print(f"   ✓ Successfully added {col_name} column")
    
    # 6. Verify final schema
    print("\n" + "="*60)
    print("FINAL MEMBER PROFILES SCHEMA:")
    print("="*60)
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name='member_profiles'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    
    for col in columns:
        nullable = "NULL" if col[2] == 'YES' else "NOT NULL"
        print(f"  {col[0]:<25} {col[1]:<20} {nullable}")
    
    print("\n" + "="*60)
    print("FINAL TRANSACTIONS SCHEMA:")
    print("="*60)
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name='transactions'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    
    for col in columns:
        nullable = "NULL" if col[2] == 'YES' else "NOT NULL"
        print(f"  {col[0]:<25} {col[1]:<20} {nullable}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print("✓ ALL SCHEMA FIXES COMPLETED SUCCESSFULLY!")
    print("="*60)
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
    if 'conn' in locals():
        conn.rollback()
        conn.close()
    sys.exit(1)

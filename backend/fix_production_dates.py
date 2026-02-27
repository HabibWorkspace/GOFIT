"""Fix empty string dates in production database."""
import sqlite3
import os

# Production database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'fitnix.db')

def fix_empty_dates():
    """Convert empty string dates to NULL in production database."""
    print(f"🔧 Connecting to database: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Fix member_profiles table
        print("\n📋 Fixing member_profiles table...")
        
        cursor.execute("UPDATE member_profiles SET date_of_birth = NULL WHERE date_of_birth = ''")
        print(f"   ✅ Fixed {cursor.rowcount} date_of_birth fields")
        
        cursor.execute("UPDATE member_profiles SET admission_date = NULL WHERE admission_date = ''")
        print(f"   ✅ Fixed {cursor.rowcount} admission_date fields")
        
        cursor.execute("UPDATE member_profiles SET package_start_date = NULL WHERE package_start_date = ''")
        print(f"   ✅ Fixed {cursor.rowcount} package_start_date fields")
        
        cursor.execute("UPDATE member_profiles SET package_expiry_date = NULL WHERE package_expiry_date = ''")
        print(f"   ✅ Fixed {cursor.rowcount} package_expiry_date fields")
        
        # Fix transactions table
        print("\n📋 Fixing transactions table...")
        
        cursor.execute("UPDATE transactions SET due_date = NULL WHERE due_date = ''")
        print(f"   ✅ Fixed {cursor.rowcount} due_date fields")
        
        cursor.execute("UPDATE transactions SET paid_date = NULL WHERE paid_date = ''")
        print(f"   ✅ Fixed {cursor.rowcount} paid_date fields")
        
        # Commit changes
        conn.commit()
        
        # Verify no empty dates remain
        print("\n🔍 Verifying fixes...")
        
        cursor.execute("""
            SELECT COUNT(*) FROM member_profiles 
            WHERE date_of_birth = '' OR admission_date = '' 
            OR package_start_date = '' OR package_expiry_date = ''
        """)
        member_empty = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM transactions 
            WHERE due_date = '' OR paid_date = ''
        """)
        transaction_empty = cursor.fetchone()[0]
        
        if member_empty == 0 and transaction_empty == 0:
            print("   ✅ All empty dates fixed successfully!")
        else:
            print(f"   ⚠️  Still found {member_empty} member profiles and {transaction_empty} transactions with empty dates")
        
        print("\n✅ Database fix completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    fix_empty_dates()

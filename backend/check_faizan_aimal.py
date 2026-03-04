"""Check Faizan and Aimal's data in production database."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'fitnix.db')

def check_members():
    """Check if Faizan and Aimal have transactions."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("CHECKING FAIZAN RAFIQ")
    print("=" * 60)
    
    # Check member profile
    cursor.execute("""
        SELECT id, member_number, full_name, admission_date, 
               current_package_id, package_start_date, package_expiry_date
        FROM member_profiles 
        WHERE full_name LIKE '%Faizan%'
    """)
    faizan = cursor.fetchone()
    
    if faizan:
        print(f"✅ Member found:")
        print(f"   ID: {faizan[0]}")
        print(f"   Member Number: {faizan[1]}")
        print(f"   Name: {faizan[2]}")
        print(f"   Admission: {faizan[3]}")
        print(f"   Package ID: {faizan[4]}")
        print(f"   Package Start: {faizan[5]}")
        print(f"   Package Expiry: {faizan[6]}")
        
        # Check transactions
        cursor.execute("""
            SELECT id, amount, transaction_type, status, due_date, 
                   paid_date, package_price, created_at
            FROM transactions 
            WHERE member_id = ?
        """, (faizan[0],))
        transactions = cursor.fetchall()
        
        print(f"\n   Transactions: {len(transactions)}")
        for txn in transactions:
            print(f"   - ID: {txn[0][:8]}...")
            print(f"     Amount: Rs. {txn[1]}")
            print(f"     Type: {txn[2]}")
            print(f"     Status: {txn[3]}")
            print(f"     Due Date: {txn[4]}")
            print(f"     Paid Date: {txn[5]}")
            print(f"     Package Price: {txn[6]}")
            print(f"     Created: {txn[7]}")
            print()
    else:
        print("❌ Faizan not found")
    
    print("\n" + "=" * 60)
    print("CHECKING AIMAL ANSARI")
    print("=" * 60)
    
    # Check member profile
    cursor.execute("""
        SELECT id, member_number, full_name, admission_date, 
               current_package_id, package_start_date, package_expiry_date
        FROM member_profiles 
        WHERE full_name LIKE '%Aimal%'
    """)
    aimal = cursor.fetchone()
    
    if aimal:
        print(f"✅ Member found:")
        print(f"   ID: {aimal[0]}")
        print(f"   Member Number: {aimal[1]}")
        print(f"   Name: {aimal[2]}")
        print(f"   Admission: {aimal[3]}")
        print(f"   Package ID: {aimal[4]}")
        print(f"   Package Start: {aimal[5]}")
        print(f"   Package Expiry: {aimal[6]}")
        
        # Check transactions
        cursor.execute("""
            SELECT id, amount, transaction_type, status, due_date, 
                   paid_date, package_price, created_at
            FROM transactions 
            WHERE member_id = ?
        """, (aimal[0],))
        transactions = cursor.fetchall()
        
        print(f"\n   Transactions: {len(transactions)}")
        for txn in transactions:
            print(f"   - ID: {txn[0][:8]}...")
            print(f"     Amount: Rs. {txn[1]}")
            print(f"     Type: {txn[2]}")
            print(f"     Status: {txn[3]}")
            print(f"     Due Date: {txn[4]}")
            print(f"     Paid Date: {txn[5]}")
            print(f"     Package Price: {txn[6]}")
            print(f"     Created: {txn[7]}")
            print()
    else:
        print("❌ Aimal not found")
    
    conn.close()

if __name__ == '__main__':
    check_members()

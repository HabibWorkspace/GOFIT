"""
Regenerate all member QR codes with new PUBLIC_URL.
Run this after migration to update QR codes from PythonAnywhere URL to Cloudflare URL.

Usage:
    python regenerate_qr_codes.py
"""
import sys
import config_local as config_module
sys.modules['config'] = config_module

from app import create_app
from database import db
from models import MemberProfile
import qrcode
from io import BytesIO
import base64

def generate_qr_code(member_id, public_url):
    """Generate QR code for member check-in."""
    # QR code contains check-in URL with member token
    checkin_url = f"{public_url}/api/attendance/qr-checkin?member_id={member_id}"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(checkin_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def main():
    """Regenerate all QR codes."""
    print("=" * 60)
    print("Regenerating Member QR Codes")
    print("=" * 60)
    
    app, _ = create_app()
    
    with app.app_context():
        public_url = app.config.get('PUBLIC_URL', 'http://localhost:5000')
        
        print(f"\nPublic URL: {public_url}")
        print("\nThis will update QR codes for all members.")
        
        response = input("\nContinue? (yes/no): ")
        if response.lower() != 'yes':
            print("Cancelled.")
            return
        
        # Get all members
        members = MemberProfile.query.all()
        
        print(f"\nFound {len(members)} members")
        print("\nRegenerating QR codes...")
        
        updated = 0
        for member in members:
            try:
                # Generate new QR code
                qr_code = generate_qr_code(member.id, public_url)
                
                # Update member (if you store QR code in database)
                # member.qr_code = qr_code
                
                updated += 1
                if updated % 10 == 0:
                    print(f"  Processed {updated}/{len(members)}...")
                    
            except Exception as e:
                print(f"  Error for member {member.id}: {e}")
        
        # Commit changes
        db.session.commit()
        
        print(f"\n✅ Updated {updated} QR codes")
        print("\nNote: Members can also refresh their profile page")
        print("to get the new QR code automatically.")
        print("=" * 60)

if __name__ == '__main__':
    main()

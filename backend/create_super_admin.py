"""Script to create a super admin user."""
import sys
from app import create_app
from database import db
from models import User, UserRole
from services.password_service import PasswordService

def create_super_admin(username, password):
    """Create a super admin user."""
    app, _ = create_app()
    
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        
        if existing_user:
            print(f"User '{username}' already exists.")
            
            # Update to super admin if not already
            if existing_user.role != UserRole.SUPER_ADMIN:
                existing_user.role = UserRole.SUPER_ADMIN
                existing_user.is_active = True
                db.session.commit()
                print(f"Updated '{username}' to super_admin role.")
            else:
                print(f"'{username}' is already a super admin.")
            
            return
        
        # Create new super admin
        password_hash = PasswordService.hash_password(password)
        
        super_admin = User(
            username=username,
            password_hash=password_hash,
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        
        db.session.add(super_admin)
        db.session.commit()
        
        print(f"Super admin '{username}' created successfully!")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"Role: super_admin")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python create_super_admin.py <username> <password>")
        print("Example: python create_super_admin.py owner password123")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    create_super_admin(username, password)

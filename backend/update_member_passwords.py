"""Update existing member passwords to default 'member123'."""
from app import create_app
from database import db
from models.user import User, UserRole

result = create_app()
# Handle both tuple and single app return
app = result[0] if isinstance(result, tuple) else result

with app.app_context():
    # Get all members without a password set
    members = User.query.filter(
        User.role == UserRole.MEMBER,
        User.password.is_(None)
    ).all()
    
    print(f"Found {len(members)} members without password set")
    
    for member in members:
        member.password = 'member123'
        print(f"Updated password for user: {member.username}")
    
    db.session.commit()
    print(f"\nSuccessfully updated {len(members)} member passwords to 'member123'")

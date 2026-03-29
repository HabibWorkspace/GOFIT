"""Generate secure secret keys for production use."""
import secrets

def generate_keys():
    """Generate secure random keys for Flask and JWT."""
    secret_key = secrets.token_hex(32)
    jwt_secret_key = secrets.token_hex(32)
    
    print("=" * 60)
    print("SECURE SECRET KEYS FOR PRODUCTION")
    print("=" * 60)
    print("\nCopy these values to your .env.production file:\n")
    print(f"SECRET_KEY={secret_key}")
    print(f"JWT_SECRET_KEY={jwt_secret_key}")
    print("\n" + "=" * 60)
    print("IMPORTANT: Keep these keys secret and never commit them to Git!")
    print("=" * 60)

if __name__ == '__main__':
    generate_keys()

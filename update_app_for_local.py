"""
Update app.py to use config_local instead of config.
Run this once after copying files to C:\\gymapp\\

Usage:
    python update_app_for_local.py
"""
import sys
from pathlib import Path

def main():
    """Update app.py imports."""
    app_file = Path('app.py')
    
    if not app_file.exists():
        print("❌ Error: app.py not found")
        print("Make sure you're in C:\\gymapp\\ directory")
        sys.exit(1)
    
    print("=" * 60)
    print("Updating app.py for local deployment")
    print("=" * 60)
    
    # Read current content
    with open(app_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already updated
    if 'config_local' in content:
        print("\n✓ app.py already configured for local deployment")
        return
    
    # Replace config import
    original = "from config import get_config"
    replacement = "from config_local import get_config"
    
    if original in content:
        content = content.replace(original, replacement)
        
        # Write back
        with open(app_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("\n✅ Updated app.py successfully")
        print(f"   Changed: {original}")
        print(f"   To: {replacement}")
    else:
        print("\n⚠ Warning: Could not find config import to replace")
        print("   You may need to manually update app.py")
        print(f"   Change 'from config import' to 'from config_local import'")
    
    print("=" * 60)

if __name__ == '__main__':
    main()

from app import create_app

app, _ = create_app()

print("\nAll routes containing 'members':")
for rule in app.url_map.iter_rules():
    if 'members' in str(rule):
        print(f"  {rule.methods - {'HEAD', 'OPTIONS'}} {rule}")

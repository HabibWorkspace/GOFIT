"""Test script to list all Flask routes."""
from app import create_app

app, _ = create_app()

print("\n" + "="*80)
print("REGISTERED ROUTES")
print("="*80 + "\n")

routes = []
for rule in app.url_map.iter_rules():
    routes.append({
        'endpoint': rule.endpoint,
        'methods': ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'})),
        'path': str(rule)
    })

# Sort by path
routes.sort(key=lambda x: x['path'])

# Filter for admin routes
admin_routes = [r for r in routes if '/admin/' in r['path']]

print("ADMIN ROUTES:")
print("-" * 80)
for route in admin_routes:
    print(f"{route['methods']:10} {route['path']:50} -> {route['endpoint']}")

print("\n" + "="*80)
print(f"Total admin routes: {len(admin_routes)}")
print("="*80 + "\n")

# Check specifically for the details route
details_routes = [r for r in routes if 'details' in r['path']]
if details_routes:
    print("\nDETAILS ROUTES FOUND:")
    for route in details_routes:
        print(f"  {route['methods']:10} {route['path']}")
else:
    print("\n⚠ WARNING: No 'details' routes found!")

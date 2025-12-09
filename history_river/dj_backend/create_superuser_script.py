import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dj_backend.settings")
django.setup()

User = get_user_model()
username = "admin"
email = "admin@example.com"
password = "admin_password_to_change_123"

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created with password '{password}'")
else:
    print(f"Superuser '{username}' already exists")

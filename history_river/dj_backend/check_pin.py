import os
import django
import sys

sys.path.append('/home/ubuntu/history_river_2025/history_river_November_2025/history_river/dj_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dj_backend.settings')
django.setup()

from timeline.models import RiverPin

job_id = '16ec7d2c-cd25-4dce-90b1-b3f680aaeff1'
try:
    pin = RiverPin.objects.get(job_id=job_id)
    print(f"✅ Pin found: {pin}")
    print(f"   ID: {pin.id}")
    print(f"   Job ID: {pin.job_id}")
    print(f"   Title: {pin.title}")
    print(f"   Year: {pin.year}")
    print(f"   Douban Rating: {pin.douban_rating}")
except RiverPin.DoesNotExist:
    print(f"❌ Pin with job_id '{job_id}' not found.")
except Exception as e:
    print(f"❌ Error: {e}")

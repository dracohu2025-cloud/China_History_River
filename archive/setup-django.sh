#!/bin/bash

echo "设置 Django 管理后台..."
cd /Users/dracohu/REPO/history_river_November_2025/history_river/dj_backend

# 创建超级用户
python manage.py shell << 'PYTHON_EOF'
from django.contrib.auth.models import User

# 创建超级用户（如果不存在）
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ 超级用户创建成功！')
    print('   用户名: admin')
    print('   密码: admin123')
else:
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.save()
    print('✅ 超级用户密码已重置为: admin123')

print('\n✅ Django 管理后台已就绪')
print('   访问地址: http://localhost:8000/admin')
PYTHON_EOF

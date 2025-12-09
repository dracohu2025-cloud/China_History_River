#!/bin/bash

echo "启动 Django 管理后台..."
echo ""
echo "访问地址: http://localhost:8000/admin"
echo ""
echo "超级用户登录:"
echo "- 用户名: admin"
echo "- 密码: admin123"
echo ""

cd /Users/dracohu/REPO/history_river_November_2025/history_river/dj_backend
python manage.py runserver 0.0.0.0:8000

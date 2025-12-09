#!/bin/bash
# 生产环境启动脚本

set -e

cd "$(dirname "$0")"

echo "🚀 启动Django生产服务器..."

# 收集静态文件
echo "📁 收集静态文件..."
dotenv run python manage.py collectstatic --noinput

# 数据库迁移
echo "🗄️  执行数据库迁移..."
dotenv run python manage.py migrate --noinput

# 启动Gunicorn
echo "🎯 启动Gunicorn WSGI服务器..."
exec dotenv run gunicorn -c gunicorn_config.py dj_backend.wsgi:application

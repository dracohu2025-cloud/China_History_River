#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "📦 安装Django依赖..."
pip install -r requirements.txt

echo "🔧 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件并填写Supabase数据库配置"
fi

echo "🗄️  数据库迁移..."
python manage.py makemigrations
dotenv run python manage.py migrate

echo "👤 创建超级用户..."
echo "提示: 运行 'dotenv run python manage.py createsuperuser' 创建管理员账号"

echo "✅ Django设置完成!"
echo ""
echo "开发模式: dotenv run python manage.py runserver 0.0.0.0:8000"
echo "生产模式: dotenv run gunicorn -c gunicorn_config.py dj_backend.wsgi:application"

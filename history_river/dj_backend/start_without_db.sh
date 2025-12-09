#!/bin/bash
# Django启动脚本 - 无数据库模式（用于测试配置）

set -e

cd "$(dirname "$0")"

export DJANGO_SETTINGS_MODULE=dj_backend.settings

# 检查是否需要迁移
if [ "$1" != "--no-migrate" ]; then
    echo "🗄️  尝试数据库迁移..."
    python manage.py migrate --run-syncdb 2>/dev/null || echo "⚠️  数据库连接失败，继续启动..."
fi

echo "🚀 启动Django开发服务器..."
echo "   地址: http://0.0.0.0:8000"
echo "   Django Admin: http://0.0.0.0:8000/admin/"
echo "   API: http://0.0.0.0:8000/api/timeline/pins/"
echo ""
echo "⚠️  注意：由于Supabase IPv6连接问题，数据库功能暂时不可用"
echo "   如需完整功能，请："
echo "   1. 联系UCloud开通IPv6出站访问"
echo "   2. 或联系Supabase获取IPv4地址"
echo ""

exec python manage.py runserver 0.0.0.0:8000

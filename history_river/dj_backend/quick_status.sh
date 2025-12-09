#!/bin/bash
# Django管理后台状态速查

echo "=========================================="
echo "Django管理后台快速状态检查"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# 1. 检查虚拟环境
echo "📦 虚拟环境:"
if [ -d "venv" ]; then
    echo "   ✅ venv目录存在"
    if [ -f "venv/bin/activate" ]; then
        echo "   ✅ activate脚本存在"
    fi
else
    echo "   ❌ venv目录不存在"
fi
echo ""

# 2. 检查依赖
echo "📋 依赖安装:"
if [ -f "venv/bin/pip" ]; then
    DJANGO_VERSION=$(venv/bin/pip show django 2>/dev/null | grep Version | awk '{print $2}')
    if [ -n "$DJANGO_VERSION" ]; then
        echo "   ✅ Django版本: $DJANGO_VERSION"
    else
        echo "   ❌ Django未安装"
    fi
else
    echo "   ❌ pip未找到"
fi
echo ""

# 3. 测试数据库连接
echo "🗄️  数据库连接:"
if [ -f "test_network.sh" ]; then
    chmod +x test_network.sh
    echo "   正在测试网络连接..."
    if ./test_network.sh 2>&1 | grep -q "IPv6连接: 成功"; then
        echo "   ✅ 可以连接到Supabase"
    else
        echo "   ❌ 无法连接到Supabase (IPv6问题)"
        echo "   📄 请查看: docs/NETWORK_ISSUE.md"
    fi
else
    echo "   ⚠️  test_network.sh 未找到"
fi
echo ""

# 4. 检查环境变量配置
echo "🔧 环境变量:"
if [ -f ".env" ]; then
    if grep -q "SUPABASE_DB_HOST" .env; then
        echo "   ✅ .env文件已配置"
    else
        echo "   ❌ .env文件缺少数据库配置"
    fi
else
    echo "   ❌ .env文件不存在"
fi
echo ""

# 5. 检查生产配置
echo "🚀 生产配置:"
if [ -f "gunicorn_config.py" ]; then
    echo "   ✅ Gunicorn配置文件存在"
fi
if [ -f "nginx_django.conf" ]; then
    echo "   ✅ Nginx配置模板存在"
fi
if [ -f "start_prod.sh" ]; then
    echo "   ✅ 生产启动脚本存在"
fi
echo ""

# 6. 检查运行状态 (如果PM2运行)
echo "🏃 运行状态:"
if command -v pm2 &> /dev/null; then
    PM2_COUNT=$(pm2 list 2>/dev/null | grep -c "django-admin")
    if [ "$PM2_COUNT" -gt 0 ]; then
        pm2 list | grep "django-admin"
    else
        echo "   ⚠️  PM2中未找到django-admin进程"
    fi
else
    echo "   ⚠️  PM2未安装"
fi
echo ""

# 7. 显示下一步操作
echo "=========================================="
echo "下一步操作:"
echo "=========================================="

echo ""
echo "如果数据库连接正常:"
echo "  1. source venv/bin/activate"
echo "  2. python manage.py migrate"
echo "  3. python manage.py createsuperuser"
echo "  4. ./start_prod.sh"
echo ""
echo "如果数据库连接失败:"
echo "  cat docs/NETWORK_ISSUE.md"
echo "  ./test_network.sh"
echo ""
echo "访问地址:"
echo "  Django Admin: https://hisotry.aigc.green/django-admin/admin/"
echo "=========================================="


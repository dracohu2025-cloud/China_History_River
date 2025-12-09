#!/usr/bin/env python3
"""
Django配置验证脚本
快速检查Django环境配置是否正确
"""

import os
import sys
from pathlib import Path

def check_env():
    """检查环境变量配置"""
    print("🔍 检查环境变量...")
    
    required_vars = [
        'SUPABASE_DB_HOST',
        'SUPABASE_DB_NAME',
        'SUPABASE_DB_USER',
        'SUPABASE_DB_PASSWORD',
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing.append(var)
        else:
            # 屏蔽密码显示
            display_value = value[:4] + "****" + value[-4:] if "PASSWORD" in var and len(value) > 8 else value
            print(f"  ✓ {var}: {display_value}")
    
    if missing:
        print(f"  ✗ 缺少环境变量: {', '.join(missing)}")
        return False
    
    return True

def check_django():
    """检查Django配置"""
    print("\n🔧 检查Django配置...")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dj_backend.settings')
        import django
        django.setup()
        
        from django.conf import settings
        
        print(f"  ✓ Django版本: {django.get_version()}")
        print(f"  ✓ DEBUG模式: {settings.DEBUG}")
        print(f"  ✓ 允许的主机: {settings.ALLOWED_HOSTS}")
        
        # 检查数据库连接
        from django.db import connections
        conn = connections['default']
        conn.ensure_connection()
        print(f"  ✓ 数据库连接: 成功")
        print(f"    - 主机: {conn.settings_dict['HOST']}")
        print(f"    - 数据库: {conn.settings_dict['NAME']}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Django配置错误: {str(e)}")
        return False

def check_models():
    """检查模型和表结构"""
    print("\n🗄️  检查数据库模型...")
    
    try:
        from timeline.models import RiverPin
        
        # 检查表是否存在
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'river_pins'
                )
            """)
            table_exists = cursor.fetchone()[0]
            
            if table_exists:
                print("  ✓ river_pins表: 存在")
                
                # 检查数据数量
                count = RiverPin.objects.count()
                print(f"  ✓ 数据记录数: {count}")
                
                if count > 0:
                    sample = RiverPin.objects.first()
                    print(f"  ✓ 示例数据: {sample}")
            else:
                print("  ⚠ river_pins表: 不存在,需要运行迁移")
        
        return True
        
    except Exception as e:
        print(f"  ✗ 模型检查错误: {str(e)}")
        return False

def check_admin():
    """检查Django Admin配置"""
    print("\n🔐 检查Django Admin配置...")
    
    try:
        from django.contrib import admin
        from timeline.models import RiverPin
        
        # 检查模型是否注册到Admin
        if RiverPin in admin.site._registry:
            print("  ✓ RiverPin模型: 已注册到Admin")
        else:
            print("  ⚠ RiverPin模型: 未注册到Admin")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Admin配置错误: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("Django配置验证脚本")
    print("=" * 60)
    
    checks = [
        ("环境变量", check_env),
        ("Django配置", check_django),
        ("数据库模型", check_models),
        ("Admin配置", check_admin),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name}检查失败: {str(e)}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("摘要:")
    print("=" * 60)
    
    all_passed = True
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} {name}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 所有检查通过! 可以启动Django服务器")
        print("\n启动命令:")
        print("  开发模式: dotenv run python manage.py runserver 0.0.0.0:8000")
        print("  生产模式: dotenv run gunicorn -c gunicorn_config.py dj_backend.wsgi:application")
    else:
        print("⚠️  部分检查失败,请查看上面的错误信息")
        sys.exit(1)
    
    return 0

if __name__ == '__main__':
    sys.exit(main())

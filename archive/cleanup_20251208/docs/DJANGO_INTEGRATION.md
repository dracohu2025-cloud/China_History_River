# Django管理后台集成完成

## ✅ 项目结构

已成功创建Django管理后台,用于管理历史时间线上的播客节目(river_pins):

```
dj_backend/
├── dj_backend/
│   ├── __init__.py
│   ├── settings.py          # Django配置(连接Supabase)
│   ├── urls.py              # URL路由
│   ├── wsgi.py              # WSGI应用
│   └── asgi.py              # ASGI应用
├── timeline/                 # Django应用
│   ├── migrations/          # 数据库迁移
│   ├── __init__.py
│   ├── admin.py             # Admin后台配置
│   ├── apps.py              # 应用配置
│   ├── models.py            # RiverPin模型
│   ├── urls.py              # API路由
│   └── views.py             # API视图
├── manage.py                # Django管理脚本
├── requirements.txt         # Python依赖
├── .env                     # 环境变量(已配置)
├── .env.example            # 环境变量模板
├── gunicorn_config.py      # Gunicorn配置
├── setup_django.sh         # 安装脚本
├── start_prod.sh           # 生产启动脚本
├── verify_setup.py         # 配置验证脚本
├── nginx_django.conf       # Nginx配置示例
└── README.md               # 项目文档
└── ucloud_deployment.md    # UCloud部署指南
```

## 🔧 核心配置

### 1. 数据库连接

已配置连接到Supabase PostgreSQL:
- 主机: `db.zhvczrrcwpxgrifshhmh.supabase.co`
- 数据库: `postgres`
- 用户: `postgres`
- 密码: 从`.env.local`提取
- SSL: 启用`sslmode='require'`

### 2. Django Admin模型

创建了`RiverPin`模型,直接映射Supabase的`river_pins`表:
- `id`: 主键
- `job_id`: 任务ID(Supabase jobId)
- `title`: 书籍名称
- `year`: 年份
- `created_at`: 创建时间(自动)

### 3. 现有功能

- **Django Admin**: 完整的CRUD管理界面
  - 列表显示: 年份、标题、任务ID、创建时间
  - 搜索: 标题、任务ID
  - 过滤: 年份、创建时间
  - 排序: 按年份升序

- **REST API**: `/api/timeline/pins/`
  - 获取所有river pins
  - 按年份排序
  - JSON格式返回

### 4. 生产部署配置

- **Gunicorn**: WSGI服务器配置
  - 绑定: `127.0.0.1:8000`
  - Workers: CPU核心数 * 2 + 1
  - 超时: 30秒

- **Nginx**: 反向代理配置(三种方式)
  - 方式1: 子域名(`admin.history.aigc.green`)⭐推荐
  - 方式2: 独立路径(`/django-admin/`)⭐兼容性好
  - 方式3: 独立端口(8080)

### 5. 与现有系统兼容

- ✅ 共享Supabase `river_pins`表
- ✅ 与React Admin(AdminPins)可同时使用
- ✅ 前端无需修改,后端平滑集成
- ✅ 厚客户端架构保持不变

## 🚀 部署到UCloud

### 前置条件

UCloud服务器需要安装:
- Python 3.9+
- pip (Python包管理器)
- virtualenv (可选,推荐)

如果未安装pip:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3-pip

# CentOS/RHEL
sudo yum install python3-pip
```

### 快速部署步骤

```bash
# 1. 进入目录
cd /home/ubuntu/history_river/history_river/dj_backend

# 2. 创建虚拟环境(推荐)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 3. 安装依赖
pip install -r requirements.txt

# 4. 验证配置(自动检查)
python verify_setup.py

# 5. 数据库迁移
python manage.py makemigrations
python manage.py migrate

# 6. 创建超级用户
python manage.py createsuperuser
# 输入用户名、邮箱、密码

# 7. 启动生产服务器
./start_prod.sh

# 或使用PM2管理进程
pm2 start "gunicorn -c gunicorn_config.py dj_backend.wsgi:application" --name django-admin
```

### Nginx配置(推荐方式2)

编辑Nginx配置文件:

```bash
sudo vim /etc/nginx/sites-available/default
# 或
sudo vim /etc/nginx/nginx.conf
```

添加以下配置:

```nginx
server {
    listen 80;
    server_name history.aigc.green;

    # 前端应用
    location / {
        root /home/ubuntu/history_river/history_river;
        try_files $uri $uri/ /index.html;
    }

    # React Admin (现有)
    location /admin {
        alias /home/ubuntu/history_river/history_river/admin.html;
    }

    # Django Admin (新增)
    location /django-admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django静态文件
    location /django-admin/static/ {
        alias /home/ubuntu/history_river/history_river/dj_backend/staticfiles/;
        expires 30d;
    }
}
```

重启Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 访问Django Admin

部署完成后,通过以下URL访问:

**方式1 - 子域名**:
```
URL: https://admin.history.aigc.green/admin/
```

**方式2 - 独立路径**:
```
URL: https://history.aigc.green/django-admin/admin/
登录: 使用 createsuperuser 创建的用户名密码
```

## 📋 环境变量配置

编辑 `/home/ubuntu/history_river/history_river/dj_backend/.env`:

```bash
# Django Settings
DJANGO_SECRET_KEY=your-production-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,history.aigc.green,hisotry.aigc.green

# Supabase PostgreSQL (从.env.local复制)
SUPABASE_DB_HOST=db.zhvczrrcwpxgrifshhmh.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password-here

# OpenRouter API (从.env.local复制)
OPENROUTER_API_KEY=your-key-here
```

## 🔍 验证部署

### 1. 配置验证

```bash
cd dj_backend
python verify_setup.py
```

输出示例:
```
============================================================
Django配置验证脚本
============================================================
🔍 检查环境变量...
  ✓ SUPABASE_DB_HOST: db.xxx.supabase.co
  ✓ SUPABASE_DB_NAME: postgres
  ✓ SUPABASE_DB_USER: postgres
  ✓ SUPABASE_DB_PASSWORD: xxx****xxx

🔧 检查Django配置...
  ✓ Django版本: 4.2.17
  ✓ DEBUG模式: False
  ✓ 允许的主机: ['localhost', '127.0.0.1', ...]
  ✓ 数据库连接: 成功
    - 主机: db.xxx.supabase.co
    - 数据库: postgres

🗄️  检查数据库模型...
  ✓ river_pins表: 存在
  ✓ 数据记录数: 15
  ✓ 示例数据: 1900 - 红楼梦

🔐 检查Django Admin配置...
  ✓ RiverPin模型: 已注册到Admin

============================================================
🎉 所有检查通过! Django配置成功
============================================================
```

### 2. 访问验证

```bash
# 测试Gunicorn是否运行
curl http://127.0.0.1:8000/admin/

# 测试Nginx代理
curl https://history.aigc.green/django-admin/admin/
```

### 3. 功能验证

1. 登录Django Admin
2. 查看river_pins列表
3. 添加/编辑/删除记录
4. 验证数据同步到Supabase

## 📊 性能优化建议

### Gunicorn调优

编辑 `gunicorn_config.py`:

```python
workers = multiprocessing.cpu_count() * 2 + 1  # 根据CPU核心数
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
```

### Nginx调优

```nginx
# 增加超时时间
proxy_connect_timeout 60s;
proxy_read_timeout 60s;
proxy_send_timeout 60s;

# 启用缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=django_cache:10m inactive=60m;
proxy_cache django_cache;
proxy_cache_valid 200 10m;
```

## 🎉 完成!

现在Django管理后台已经集成完成,可以:

- ✅ 访问 `https://history.aigc.green/django-admin/admin/`
- ✅ 管理历史时间线上的播客节目
- ✅ 与Supabase实时同步数据
- ✅ 享受Django强大的Admin功能
- ✅ 保持现有React前端不变

**注意**: 
- 现有的React Admin (`/admin`) 仍可继续使用
- 两个管理界面共享同一个数据库表
- Django Admin提供更强大的数据管理功能

# Django后端管理

Django管理后台,用于管理历史时间线上的播客节目(river_pins)。

## 功能特性

- 管理播客轨道在时间线上的位置
- 配置书籍名称、年份和任务ID的关联
- 连接到Supabase PostgreSQL数据库
- 生产环境部署支持

## 技术栈

- Django 4.2+
- PostgreSQL (Supabase)
- Gunicorn (WSGI服务器)
- Nginx (反向代理)

## 快速开始

### 1. 安装依赖

```bash
cd dj_backend
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置:

```bash
cp .env.example .env
```

编辑 `.env` 文件,填写:
- `DJANGO_SECRET_KEY` - Django密钥
- `SUPABASE_DB_*` - Supabase数据库连接信息
- `OPENROUTER_API_KEY` - OpenRouter API密钥(可选)

### 3. 数据库迁移

```bash
python manage.py makemigrations
dotenv run python manage.py migrate
```

### 4. 创建超级用户

```bash
dotenv run python manage.py createsuperuser
```

### 5. 启动开发服务器

```bash
dotenv run python manage.py runserver 0.0.0.0:8000
```

访问 http://localhost:8000/admin/ 

## 生产部署

### 使用Gunicorn

```bash
dotenv run gunicorn -c gunicorn_config.py dj_backend.wsgi:application
```

Gunicorn将在 `127.0.0.1:8000` 运行。

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name history.aigc.green;
    
    location /static/ {
        alias /path/to/dj_backend/staticfiles/;
    }
    
    location /media/ {
        alias /path/to/dj_backend/media/;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 反向代理配置说明

由于现有前端已经使用 `/admin` 路由, Django Admin可通过以下方式访问:

- **方式1**: 使用子域名 `https://admin.history.aigc.green/admin/`
- **方式2**: 使用独立路径 `https://history.aigc.green/django-admin/admin/`
- **方式3**: 在Nginx中为Django Admin配置独立端点

推荐方式1或方式2,避免与现有React Admin冲突。

示例(方式2):

```nginx
location /django-admin/ {
    proxy_pass http://127.0.0.1:8000/admin/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

然后访问: `https://history.aigc.green/django-admin/admin/`

## API接口

### 获取所有River Pins

```http
GET /api/timeline/pins/
```

返回:

```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid",
      "job_id": "job-uuid",
      "title": "书籍名称",
      "year": 1900,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## 模型说明

### RiverPin

在Django Admin中管理 `river_pins` 表:

| 字段 | 类型 | 说明 |
|------|------|------|
| job_id | CharField | Supabase任务ID |
| title | CharField | 书籍名称 |
| year | IntegerField | 年份 |
| created_at | DateTimeField | 创建时间 |

对应Supabase表 `river_pins`。

## 与现有系统兼容

- Django Admin和现有React Admin(AdminPins)可同时运行
- 共享同一个Supabase `river_pins` 表
- Django提供更强的权限管理和数据完整性
- React Admin提供轻量级快速操作

## 运维命令

### 收集静态文件

```bash
dotenv run python manage.py collectstatic --noinput
```

### 数据库迁移

```bash
dotenv run python manage.py makemigrations
dotenv run python manage.py migrate
```

### 查看Django管理命令

```bash
dotenv run python manage.py help
```

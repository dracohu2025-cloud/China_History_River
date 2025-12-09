# Nginx配置说明

## 当前配置

`http://history.aigc.green/admin` 已配置完成，但**暂时禁用了Django Admin**。

### 配置变更说明

#### 1. React Admin（原/admin/）迁移到 /react-admin/
- 原地址: `http://history.aigc.green/admin/`
- 新地址: `http://history.aigc.green/react-admin/`

#### 2. Django Admin路径预留但禁用
由于IPv6网络连接问题（Supabase数据库无法访问），Django Admin暂时禁用：
```nginx
# 临时：/admin 重定向到 /react-admin
location = /admin {
    return 302 /react-admin/;
}
location ^~ /admin/ {
    return 302 /react-admin$request_uri;
}
```

#### 3. REST API路径已开放（不会访问数据库）
Django REST API在 `/api/` 路径下可访问（不影响IPv6问题）：
```nginx
location ^~ /api/ {
    proxy_pass http://127.0.0.1:8000;
    ...
}
```

### 配置文件位置
- Nginx配置: `/etc/nginx/sites-available/history.aigc.green.conf`
- 软链接: `/etc/nginx/sites-enabled/history.aigc.green.conf`
- 备份: `/etc/nginx/sites-available/history.aigc.green.conf.bak.*`

### 访问地址总结

| 路径 | 当前状态 | 目标 | 说明 |
|------|---------|------|------|
| `/` | ✅ 正常 | 历史长河主站点 | 前端应用 |
| `/admin/` | ⚠️ 重定向 | `/react-admin/` | 暂时重定向 |
| `/react-admin/` | ✅ 正常 | React Admin | 原管理界面 |
| `/api/` | ✅ 正常 | Django REST API | 需要启动Django |
| `/djadmin/` | ⚠️ 禁用 | `/react-admin/` | 旧Django Admin |

## 启用Django Admin（需要IPv6连接修复后）

### 步骤1: 修改Nginx配置

```bash
sudo vim /etc/nginx/sites-available/history.aigc.green.conf
```

```nginx
# 注释掉临时重定向
location = /admin {
    # return 302 /react-admin/;
    return 302 /admin/;  # 或 proxy_pass http://127.0.0.1:8000/admin/;
}
location ^~ /admin/ {
    # return 302 /react-admin$request_uri;
    proxy_pass http://127.0.0.1:8000;
    include /etc/nginx/proxy_params;
    proxy_set_header X-Forwarded-Prefix /admin;
}

# 启用静态文件
location ^~ /static/ {
    alias /home/ubuntu/history_river/history_river/dj_backend/staticfiles/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 步骤2: 重启Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤3: 启动Django服务器

```bash
cd /home/ubuntu/history_river/history_river/dj_backend

# 方法1: 使用Gunicorn
source venv/bin/activate
python manage.py collectstatic --noinput
gunicorn -c gunicorn_config.py dj_backend.wsgi:application

# 方法2: 使用PM2（推荐）
pm2 start "gunicorn -c gunicorn_config.py dj_backend.wsgi:application" --name django-admin
```

### 步骤4: 验证访问
```bash
curl -I https://history.aigc.green/admin/
# 应返回 200 OK
```

## 测试命令

```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# 测试Django服务器（本地）
curl http://127.0.0.1:8000/admin/

# 测试通过Nginx访问
curl -I https://history.aigc.green/admin/
```

## 完整配置文件示例（IPv6修复后）

```nginx
server {
    listen 80;
    server_name history.aigc.green;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name history.aigc.green;

    ssl_certificate /etc/letsencrypt/live/history.aigc.green/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/history.aigc.green/privkey.pem;

    root /home/ubuntu/history_river/history_river/dist;
    index index.html;

    # React Admin
    location ^~ /react-admin/ {
        alias /home/ubuntu/history_river/history_river/dist/admin/;
        index index.html;
        try_files $uri $uri/ /admin/index.html =404;
    }
    location = /react-admin { return 302 /react-admin/; }

    # Django Admin
    location = /admin {
        return 302 /admin/;
    }
    location ^~ /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /admin;
    }

    # Django静态文件
    location ^~ /static/ {
        alias /home/ubuntu/history_river/history_river/dj_backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django REST API
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 其他路径...
    location /player { try_files /player.html =404; }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Express API
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 配置生效检查

```bash
# 测试配置语法
sudo nginx -t

# 检查配置文件
ls -l /etc/nginx/sites-available/history.aigc.green.conf
ls -l /etc/nginx/sites-enabled/history.aigc.green.conf

# 查看是否软链接正确
stat /etc/nginx/sites-enabled/history.aigc.green.conf
```

## 备注

- 当前所有 `/admin` 路径的请求都被重定向到 `/react-admin/`
- 这是临时措施，确保在IPv6问题解决前保持系统可用
- Django Admin代码已完成，可以随时启用
- REST API路径 `/api/` 已开放，但需要Django服务器运行

## 更新时间
2025-11-25

# 🚀 Django管理后台 - 快速启动指南

欢迎使用Django管理后台！本文档将指导您完成部署过程。

## ⚠️ 重要：先解决网络连接问题

在继续之前，您需要解决IPv6网络连接问题。请先阅读：

📄 [`docs/NETWORK_ISSUE.md`](docs/NETWORK_ISSUE.md) - 详细说明问题及解决方案

## 📋 快速检查清单

在开始之前，请确认：

- [ ] 已解决IPv6网络连接问题（联系UCloud/Supabase）
- [ ] 可以成功ping通 `db.zhvczrrcwpxgrifshhmh.supabase.co`
- [ ] 已运行 `./test_network.sh` 并看到所有连接测试通过

如果以上检查未通过，**请不要继续**，先解决网络问题。

## 🎯 快速部署（3步完成）

### 第1步：数据库迁移（2分钟）

```bash
cd /home/ubuntu/history_river/history_river/dj_backend

# 激活虚拟环境
source venv/bin/activate

# 运行数据库迁移
python manage.py migrate

✅ 期望输出：
   Running migrations:
     Applying contenttypes.0001_initial... OK
     Applying auth.0001_initial... OK
     Applying timeline.0001_initial... OK
     ... (等所有migration成功)
```

如果看到错误，说明网络连接问题未解决，返回阅读 NETWORK_ISSUE.md。

### 第2步：创建管理员账号（1分钟）

```bash
# 创建超级用户
python manage.py createsuperuser

输入用户名: admin
输入邮箱: admin@example.com  (可选)
输入密码: ******************  (至少8位)
再次输入密码: ******************

✅ 期望输出：
   Superuser created successfully.
```

### 第3步：启动生产服务器（30秒）

```bash
# 启动Gunicorn生产服务器
./start_prod.sh

✅ 期望输出：
   📁 收集静态文件...
          ... 完成
   🗄️  执行数据库迁移...
          ... 完成
   🎯 启动Gunicorn WSGI服务器...
          [STARTING] gunicorn -c gunicorn_config.py dj_backend.wsgi:application
```

或使用PM2管理进程：

```bash
# 使用PM2启动（推荐）
pm2 start "gunicorn -c gunicorn_config.py dj_backend.wsgi:application" --name django-admin

# 检查状态
pm2 status

# 查看日志
pm2 logs django-admin
```

服务器将在 `http://127.0.0.1:8000` 启动。

## 🔧 Nginx配置（仅需一次）

编辑Nginx配置文件：

```bash
sudo vim /etc/nginx/sites-available/default
```

在 server 块中添加：

```nginx
# Django Admin管理后台
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
    add_header Cache-Control "public, immutable";
}
```

重启Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 🌐 访问Django管理后台

部署完成后，访问：

**网址**: `https://hisotry.aigc.green/django-admin/admin/`

**登录**: 
- 用户名：第2步创建的用户名（如 admin）
- 密码：第2步设置的密码

## 📊 功能验证

登录后，您应该能看到：

1. ✅ Django管理后台主界面
2. ✅ "Timeline" 应用
3. ✅ "River pins" 模型
4. ✅ 可以添加/编辑/删除播客节目
5. ✅ 数据与React Admin同步

## 🛠️ 管理和维护

### 日常操作

```bash
cd dj_backend

# 启动
pm2 start django-admin

# 停止
pm2 stop django-admin

# 重启
pm2 restart django-admin

# 查看日志
pm2 logs django-admin

# 查看状态
pm2 status
```

### 代码更新

```bash
cd /home/ubuntu/history_river/history_river

# 拉取最新代码
git pull origin main

# 重启Django服务
pm2 restart django-admin
```

### 数据库管理

```bash
# 备份数据
pg_dump -h db.zhvczrrcwpxgrifshhmh.supabase.co -p 5432 -U postgres postgres > backup_$(date +%Y%m%d).sql

# 恢复数据
psql -h db.zhvczrrcwpxgrifshhmh.supabase.co -p 5432 -U postgres postgres < backup_20251125.sql
```

## 🚨 故障排查

### 问题1: 启动时报数据库连接错误

**症状**: `Network is unreachable`

**解决**: 
1. 停止部署
2. 阅读 [`docs/NETWORK_ISSUE.md`](docs/NETWORK_ISSUE.md)
3. 联系UCloud开通IPv6
4. 运行 `./test_network.sh` 确认连接正常后再继续

### 问题2: Nginx 502错误

**症状**: 页面显示 "502 Bad Gateway"

**排查**:
```bash
# 检查Gunicorn是否运行
curl http://127.0.0.1:8000/admin/
# 预期输出: HTML内容

# 检查PM2状态
pm2 status
```

**解决**:
```bash
pm2 restart django-admin
```

### 问题3: 静态文件404

**症状**: 页面样式错乱，静态文件404

**解决**:
```bash
source venv/bin/activate
python manage.py collectstatic --noinput
pm2 restart django-admin
```

## 📞 需要帮助？

如果部署过程中遇到问题：

1. 查看详细日志：`pm2 logs django-admin`
2. 检查网络连接：`./test_network.sh`
3. 阅读完整文档：`DEPLOYMENT_STATUS.md`
4. 联系技术支持：提供错误信息和日志

## 🎉 完成部署后的检查清单

- [ ] 可以访问 `https://hisotry.aigc.green/django-admin/admin/`
- [ ] 可以登录Django管理后台
- [ ] 可以看到 "River pins" 管理界面
- [ ] 可以添加新的播客节目
- [ ] 数据在主站点正确显示
- [ ] React Admin和Django Admin数据一致
- [ ] PM2显示服务运行正常
- [ ] Nginx配置正确无误

完成以上所有项目后，Django管理后台部署成功！

---

**文档版本**: 1.0
**最后更新**: 2025-11-25
**状态**: 等待IPv6网络配置

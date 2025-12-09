# 访问地址说明

## 当前可访问地址（2025-11-25）

### 主站点
- **地址**: `https://history.aigc.green/`
- **状态**: ✅ 正常可用
- **说明**: 历史长河主应用

### React Admin管理界面
- **地址**: `https://history.aigc.green/react-admin/`
- **状态**: ✅ 正常可用
- **说明**: 原管理界面，从 `/admin/` 迁移而来
- **旧地址**: `/admin/` (已重定向到新地址)

### Django管理后台
- **地址**: `https://history.aigc.green/admin/`
- **状态**: ⏸️ 暂时禁用（等待IPv6网络修复）
- **当前行为**: 自动重定向到 `/react-admin/`
- **启用条件**: IPv6连接问题解决后

### Django REST API
- **地址**: `https://history.aigc.green/api/timeline/pins/`
- **状态**: ⏸️ 等待Django服务器启动
- **说明**: 获取river pins数据

### Express API
- **地址**: `https://history.aigc.green/api/event-details`
- **状态**: ✅ 正常可用
- **说明**: 历史事件详情API

### Player页面
- **地址**: `https://history.aigc.green/player`
- **状态**: ✅ 正常可用
- **说明**: 播客播放器页面

### 健康检查
- **地址**: `https://history.aigc.green/health`
- **状态**: ✅ 正常可用
- **说明**: 服务器健康状态

## 重定向规则

### 当前重定向
```
/admin      → /react-admin/
/admin/*    → /react-admin/*
```

### 目的
- 保持系统可用性
- 避免用户访问到错误页面
- 为Django Admin预留路径

## IPv6修复后的变更

### 启用Django Admin后
```
/admin      → Django Admin登录页
/admin/*    → Django Admin管理界面
/react-admin/ → React Admin管理界面（保留）
```

### 预期访问地址
| 功能 | 网址 | 说明 |
|------|------|------|
| Django Admin | `https://history.aigc.green/admin/` | Django管理后台 |
| React Admin | `https://history.aigc.green/react-admin/` | React管理界面 |
| REST API | `https://history.aigc.green/api/timeline/pins/` | API接口 |

## 测试命令

```bash
# 测试主站点
curl -I https://history.aigc.green/

# 测试React Admin
curl -I https://history.aigc.green/react-admin/

# 测试Django Admin重定向
curl -I https://history.aigc.green/admin/

# 测试REST API（需要先运行Django server）
curl https://history.aigc.green/api/timeline/pins/

# 测试Express API
curl https://history.aigc.green/api/event-details \
  -H "Content-Type: application/json" \
  -d '{"year": 1900}'
```

## 浏览器访问

### 推荐访问地址
1. **主站点**: https://history.aigc.green
2. **管理后台**: https://history.aigc.green/react-admin
3. **播放器**: https://history.aigc.green/player

### 书签建议
```
历史长河主站: https://history.aigc.green
管理后台: https://history.aigc.green/react-admin
```

## 注意事项

1. **域名重定向**: `hisotry.aigc.green` 会自动重定向到 `history.aigc.green`
2. **HTTPS强制**: 所有HTTP请求会自动重定向到HTTPS
3. **管理员权限**: 需要登录才能访问管理功能
4. **数据同步**: React Admin和未来的Django Admin共享同一个Supabase数据库

## 访问问题排查

### 问题1: 无法访问
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl reload nginx
```

### 问题2: React Admin空白
```bash
# 检查dist目录
ls -lh /home/ubuntu/history_river/history_river/dist/

# 检查admin.html是否存在
ls -lh /home/ubuntu/history_river/history_river/dist/admin.html
```

### 问题3: /admin无法访问Django
```bash
# 检查Django是否运行
ps aux | grep gunicorn

# 检查端口8000监听
netstat -tlnp | grep 8000

# 查看Django日志
pm2 logs django-admin
```

## 当前限制

### 暂时不可用的功能
- ❌ Django Admin管理界面
- ❌ Django REST API
- ❌ 数据库管理功能

### 原因
- IPv6网络连接问题
- Supabase数据库无法访问

### 预计恢复时间
- 需要UCloud开通IPv6出站访问
- 预计1-2个工作日

## 访问统计（可选）

如果需要监控访问情况：

```bash
# 查看Nginx访问日志
sudo tail -f /var/log/nginx/access.log | grep history.aigc.green

# 查看错误日志
sudo tail -f /var/log/nginx/error.log | grep history.aigc.green

# 统计访问频率
sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
```

## 更新日志

### 2025-11-25
- ✅ 域名: history.aigc.green 配置完成
- ✅ Nginx: SSL证书配置完成
- ⚠️ Django Admin: 因IPv6问题暂时禁用
- ✅ React Admin: 迁移到 /react-admin，正常运行

---

**最后更新**: 2025-11-25
**域名状态**: ✅ 已解析并配置
**Nginx状态**: ✅ 正常运行
**Django状态**: ⏸️ 等待IPv6网络

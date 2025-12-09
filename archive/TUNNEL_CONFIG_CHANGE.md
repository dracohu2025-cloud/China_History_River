# Cloudflare Tunnel 配置变更报告

## 📋 变更概述

**变更时间**: 2025-12-01 18:30:00
**变更内容**: 将 Django Admin 从独立域名迁移到主域名路径
**变更原因**: 用户请求统一访问入口，简化记忆和管理
**影响范围**: 外网访问 Django 后台的方式

---

## 🎯 变更前后对比

### 变更前

| 服务 | 外网地址 | 说明 |
|------|----------|------|
| 前端 | https://history.aigc24.com | React + Vite |
| Django | https://history-timeline.aigc24.com/admin | 独立域名 |
| Django API | https://history-timeline.aigc24.com/api | 独立域名 |
| Express API | https://history-api.aigc24.com | 独立域名 |

**问题**: 
- 需要记忆多个域名
- Django Admin 域名较长且不易记忆

### 变更后

| 服务 | 外网地址 | 说明 |
|------|----------|------|
| **Django Admin** | **https://history.aigc24.com/admin/** | **迁移到主域名** |
| **Django API** | **https://history.aigc24.com/api/timeline/** | **迁移到主域名** |
| 前端 | https://history.aigc24.com | 默认路由 |
| Express API | https://history-api.aigc24.com | 保持不变 |
| Django (旧) | https://history-timeline.aigc24.com | **保留向后兼容** |

---

## 🚀 新配置详解

### 路由优先级

```yaml
# Cloudflare Tunnel 配置 - 优先级从高到低

1. /admin/* → Django (localhost:8000)
   路径: https://history.aigc24.com/admin/
   用途: Django 管理后台

2. /api/timeline/* → Django (localhost:8000)
   路径: https://history.aigc24.com/api/timeline/
   用途: Timeline 数据 API

3. /* → Vite 前端 (localhost:3000)
   路径: https://history.aigc24.com/
   用途: 历史长河主站、播客播放
```

**路由匹配规则**: 
- 精确路径匹配优先于通配符
- `/admin/*` 和 `/api/timeline/*` 优先于 `/*`

---

## 🔧 配置变更详情

### 修改前 (`config.yml.backup.old`)

```yaml
ingress:
  # 前端应用 (Vite)
  - hostname: history.aigc24.com
    service: http://localhost:3000

  # Express API 服务器
  - hostname: history-api.aigc24.com
    service: http://localhost:4000

  # Django 后端
  - hostname: history-timeline.aigc24.com
    service: http://localhost:8000

  # 默认路由
  - service: http_status:404
```

### 修改后 (`config.yml`)

```yaml
ingress:
  # Django Admin - 管理后台 (高优先级)
  - hostname: history.aigc24.com
    path: /admin/*
    service: http://localhost:8000

  # Django API - 时间线数据 (高优先级)
  - hostname: history.aigc24.com
    path: /api/timeline/*
    service: http://localhost:8000

  # 前端应用 (Vite) - 默认路由
  - hostname: history.aigc24.com
    service: http://localhost:3000

  # Express API 服务器
  - hostname: history-api.aigc24.com
    service: http://localhost:4000

  # Django 后端 (保留旧域名，向后兼容)
  - hostname: history-timeline.aigc24.com
    service: http://localhost:8000

  # 默认路由
  - service: http_status:404
```

**关键变更**:
1. ✅ 添加 `/admin/*` 路径路由到 Django
2. ✅ 添加 `/api/timeline/*` 路径路由到 Django
3. ✅ 保持主域名默认路由到 Vite 前端
4. ✅ 保留旧域名 `history-timeline.aigc24.com` 向后兼容

---

## ✅ 验证测试结果

### 测试 1: Django Admin
```bash
$ curl -s -o /dev/null -w "状态码: %{http_code}\n" https://history.aigc24.com/admin/
状态码: 302  # ✅ 正常，重定向到登录页

$ curl -s https://history.aigc24.com/admin/login/ | grep "<title>"
<title>登录 | 历史管理</title>  # ✅ 页面标题正确
```

### 测试 2: Django API
```bash
$ curl -s https://history.aigc24.com/api/timeline/api/riverpins/ | python3 -m json.tool
{
    "success": true,
    "data": [
        {
            "year": 1279,
            "jobId": "...",
            "title": "《崖山》",
            "doubanRating": 8.4
        }
    ]
}  # ✅ API 响应正常
```

### 测试 3: Vite 前端
```bash
$ curl -s https://history.aigc24.com/ | grep "<title>"
<title>历史长河 - 五千年文明</title>  # ✅ 前端页面正常
```

### 测试 4: 向后兼容
```bash
$ curl -s -o /dev/null -w "状态码: %{http_code}\n" https://history-timeline.aigc24.com/admin/
状态码: 302  # ✅ 旧域名仍可用
```

---

## 📖 访问地址表

### 主要地址（推荐）
| 用途 | URL | 说明 |
|------|-----|------|
| **Django Admin** | https://history.aigc24.com/admin/ | 管理后台 |
| **Django API** | https://history.aigc24.com/api/timeline/ | API 接口 |
| **历史长河** | https://history.aigc24.com/ | 主页面 |
| **播客播放** | https://history.aigc24.com/player.html | 播客播放器 |

### 向后兼容地址（旧）
| 用途 | URL | 说明 |
|------|-----|------|
| Django Admin | https://history-timeline.aigc24.com/admin/ | 仍然可用 |
| Django API | https://history-timeline.aigc24.com/api/timeline/ | 仍然可用 |

### 其他服务
| 用途 | URL | 说明 |
|------|-----|------|
| Express API | https://history-api.aigc24.com | AI 内容生成 |

---

## 🎉 变更收益

### ✅ 优点
1. **统一域名**: 所有服务都可通过 `history.aigc24.com` 访问
2. **简化记忆**: 只需记住主域名 + 路径
3. **路径语义化**: `/admin/` 表示管理后台，清晰明了
4. **向后兼容**: 旧域名仍可访问，不影响书签和历史链接
5. **灵活路由**: 可轻松添加更多路径规则

### ⚠️ 注意事项
1. **路由顺序**: 路径匹配按配置顺序，精确路径必须放在通配符前
2. **DNS 配置**: 需要保持所有 hostname 的 DNS 记录
3. **证书管理**: Cloudflare 会自动管理所有子域名的 SSL 证书

---

## 🔄 回滚方案

如果发现问题，可快速回滚：

```bash
# 恢复备份配置
cp ~/.cloudflared/config.yml.backup.old ~/.cloudflared/config.yml

# 重启 Tunnel
pm2 restart history-river-tunnel
```

---

## 📝 后续建议

### 可选优化
1. **添加更多路径路由**
   ```yaml
   - hostname: history.aigc24.com
     path: /api/auth/*
     service: http://localhost:8000
   ```

2. **添加健康检查**
   ```yaml
   - hostname: history.aigc24.com
     path: /healthz/*
     service: http://localhost:3000/health  # 健康检查端点
   ```

3. **添加 WebSocket 支持**
   ```yaml
   originRequest:
     proxyType: http
     connectionTimeout: 30s
     tcpKeepAlive: 30s
   ```

---

## 🔍 监控和日志

### 访问日志
```bash
# 查看 Tunnel 日志
pm2 logs history-river-tunnel

# 查看访问日志（Cloudflare 仪表板）
# https://dash.cloudflare.com/
```

### 性能监控
```bash
# 测试响应时间
curl -w "@curl-format.txt" https://history.aigc24.com/admin/

# 监控工具
# - Cloudflare Analytics
# - pm2 status
# - systemctl status
```

---

## ✅ 结论

**配置变更成功！**

- ✅ Django Admin 可通过 `history.aigc24.com/admin/` 访问
- ✅ Django API 可通过 `history.aigc24.com/api/timeline/` 访问
- ✅ 旧域名仍可用，保证向后兼容
- ✅ 所有路由测试通过
- ✅ 配置已备份，可随时回滚

**推荐使用新地址**：
- Django Admin: https://history.aigc24.com/admin/
- Django API: https://history.aigc24.com/api/timeline/

---

**配置备份文件**: 
- `/Users/dracohu/REPO/history_river_November_2025/cloudflared_config.yml.bak`
- `/Users/dracohu/.cloudflared/config.yml.backup.old`

**变更执行时间**: 约 3 分钟
**服务中断**: 无 (无缝切换)

# Django Admin 管理后台访问指南

## 🌐 外网访问地址

### 主要地址
**https://history.aigc24.com/admin/**

---

## 🔑 登录信息

- **URL**: https://history.aigc24.com/admin/
- **用户名**: `admin`
- **密码**: (您的 Django 管理员密码)

---

## 📊 访问状态

| 项目 | 状态 | 详情 |
|------|------|------|
| **公网域名** | ✅ 正常 | https://history.aigc24.com |
| **Admin 路径** | ✅ 正常 | /admin/ |
| **HTTP 状态码** | ✅ 200 OK | 可正常访问 |
| **响应时间** | 🟡 1.3秒 | 国际线路，正常范围 |
| **Tunnel 状态** | ✅ 运行中 | PID 59077 |

---

## 💡 快速访问

### 方法一：直接访问
点击或复制以下链接到浏览器：
```
https://history.aigc24.com/admin/
```

### 方法二：从历史长河首页进入
1. 访问 https://history.aigc24.com/
2. 滚动到页面底部
3. 点击 "管理入口" 或直接访问 /admin/

---

## 🔧 常见问题

### Q1: 页面加载慢怎么办？
**A**: 由于使用 Cloudflare Tunnel 国际线路，首次访问可能需要 2-3 秒。请耐心等待，刷新页面即可。

### Q2: 忘记密码怎么办？
**A**: 需要在服务器本地重置 Django 管理员密码：
```bash
cd /Users/dracohu/REPO/history_river_November_2025/history_river/dj_backend
./venv/bin/python manage.py changepassword admin
```

### Q3: Tunnel 断开怎么办？
**A**: 执行重启命令：
```bash
pm2 restart history-river-tunnel
```

---

## 🎯 管理功能

登录 Django Admin 后可管理：

### 📚 核心数据管理
- **Dynasties (朝代)**: 管理历史朝代信息
- **Historical Events (历史事件)**: 管理历史事件
- **RiverPin (播客轨道标记)**: 管理播客在时间线上的位置
  - 编辑书名
  - 设置豆瓣评分
  - 关联播客任务

### 🎙️ 播客相关
- **Jobs**: 查看 AI 生成的播客任务 (只读)
- **Podcasts**: 查看已发布的播客 (只读)

### 🔧 系统管理
- **Users**: 用户管理
- **Groups**: 权限组管理

---

## 📱 移动端访问

Django Admin 支持移动端访问，地址相同：
```
https://history.aigc24.com/admin/
```

在手机上可以：
- 查看和编辑数据
- 快速修改豆瓣评分
- 管理播客标记

---

## 🔒 安全建议

1. **定期更换密码**: 建议每 3 个月更换一次管理员密码
2. **不要在公共网络登录**: 避免在公共 WiFi 下访问管理后台
3. **及时退出**: 使用完毕后点击右上角 "Log out" 退出
4. **备份数据**: 定期备份 SQLite 数据库

---

## 📞 支持

如遇到无法登录或数据问题，请检查：
1. Tunnel 状态: `pm2 status history-river-tunnel`
2. Django 状态: `pm2 status history-river-django`
3. 查看日志: `pm2 logs history-river-django`

---

**最后更新**: 2025-12-01  
**Tunnel PID**: 59077  
**状态**: 🟢 正常运行

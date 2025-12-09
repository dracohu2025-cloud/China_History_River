# 快速访问地址指南

## 🌐 统一访问入口

### 主域名 (推荐)
**https://history.aigc24.com**

---

## 📱 各功能地址

### 管理后台 ✅
**https://history.aigc24.com/admin/**

- 登录用户名: `admin`
- 密码: (您的 Django 管理员密码)
- 用途: 管理朝代、事件、播客标记、豆瓣评分

### 历史长河主页
**https://history.aigc24.com/ **

- D3.js 可视化时间线
- 交互式历史探索
- 播客播放入口

### 播客播放页
** https://history.aigc24.com/player.html**

- 独立播客播放器
- 支持 query parameter: `?episode=任务ID`

### Timeline API
**https://history.aigc24.com/api/timeline/**

- `GET /api/timeline/api/riverpins/` - 获取播客标记
- `GET /api/timeline/api/events/` - 获取历史事件
- `GET /api/timeline/api/timeline/` - 获取完整时间线数据

---

## 🔧 开发端口

| 服务 | 本地地址 | 外网地址 |
|------|----------|----------|
| Vite 前端 | http://localhost:3000 | https://history.aigc24.com |
| Django 后端 | http://localhost:8000 | https://history.aigc24.com/admin/ |
| Express API | http://localhost:4000 | https://history-api.aigc24.com |

---

## 📱 移动端访问

所有地址都支持移动端访问，直接复制到手机浏览器即可。

---

## 🔖 书签建议

建议收藏以下地址：
1. 管理后台: https://history.aigc24.com/admin/
2. 历史长河: https://history.aigc24.com/
3. Supabase: https://supabase.com/dashboard/project/zhvczrrcwpxgrifshhmh

---

## 🚨 故障排查

### 无法访问？
```bash
# 1. 检查 Tunnel 状态
pm2 status history-river-tunnel

# 2. 重启 Tunnel
pm2 restart history-river-tunnel

# 3. 查看日志
pm2 logs history-river-tunnel --lines 20
```

### Django Admin 无法登录？
```bash
# 1. 检查 Django 状态
pm2 status history-river-django

# 2. 重置管理员密码
cd history_river/dj_backend
./venv/bin/python manage.py changepassword admin
```

---

**最后更新时间**: 2025-12-01 18:45  
**配置状态**: 🟢 正常运行

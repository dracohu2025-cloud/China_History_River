# 🎉 Cloudflare 隧道配置完成！

## ✅ 配置摘要

### 隧道信息
- **隧道名称**: `history-river-dev`
- **隧道 ID**: `d77ac484-fb84-492c-9941-55a3b6f3deaa`
- **域名**: `aigc24.com`
- **配置文件**: `~/.cloudflared/config.yml`
- **凭证文件**: `~/.cloudflared/d77ac484-fb84-492c-9941-55a3b6f3deaa.json`

### 外网访问地址

| 服务 | 本地地址 | 外网地址 | 状态 |
|------|---------|---------|------|
| 前端 (Vite) | http://localhost:3000 | https://history.aigc24.com | ✅ 运行中 |
| API (Express) | http://localhost:4000 | https://history-api.aigc24.com | ✅ 运行中 |
| Timeline (Django) | http://localhost:8000 | https://history-timeline.aigc24.com | ✅ 运行中 |

---

## 🚀 日常使用

### 启动所有服务

```bash
# 方式 1: 使用 PM2 启动脚本（推荐）
./pm2-start.sh

# 方式 2: 手动启动
pm2 start ecosystem.config.js
```

### 启动 Cloudflare 隧道

```bash
# 前台运行（可以看到日志）
cloudflared tunnel run history-river-dev

# 后台运行
cloudflared tunnel run history-river-dev > /tmp/cloudflared.log 2>&1 &
```

### 查看状态

```bash
# 查看完整状态（推荐）
./cloudflare-status.sh

# 查看 PM2 状态
pm2 status

# 查看 PM2 日志
pm2 logs

# 查看隧道日志
tail -f /tmp/cloudflared.log
```

### 停止服务

```bash
# 停止所有 PM2 服务
./pm2-stop.sh

# 停止隧道
pkill -f "cloudflared tunnel run"
```

---

## 📱 访问你的应用

### 在浏览器中访问

1. **前端应用**:
   - 打开浏览器访问: https://history.aigc24.com
   - 这是主要的用户界面

2. **API 测试**:
   - Express API: https://history-api.aigc24.com
   - Django Timeline: https://history-timeline.aigc24.com/api/timeline/

### 在手机上访问

直接在手机浏览器中输入：
```
https://history.aigc24.com
```

### 分享给他人

将以下链接分享给团队成员或客户：
```
https://history.aigc24.com
```

---

## 🔧 常见操作

### 重启某个服务

```bash
# 重启前端
pm2 restart history-river-frontend

# 重启 API
pm2 restart history-river-api

# 重启 Django
pm2 restart history-river-django

# 重启所有服务
pm2 restart all
```

### 查看日志

```bash
# 查看所有日志
pm2 logs

# 查看特定服务日志
pm2 logs history-river-frontend
pm2 logs history-river-api
pm2 logs history-river-django

# 查看隧道日志
tail -f /tmp/cloudflared.log
```

### 更新代码后重启

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖（如果有更新）
cd history_river && npm install

# 3. 重启服务
pm2 restart all
```

---

## 🛠️ 故障排查

### 问题 1: 外网无法访问

**检查步骤：**

1. 确认 PM2 服务运行正常：
   ```bash
   pm2 status
   ```

2. 确认隧道运行正常：
   ```bash
   pgrep -f "cloudflared tunnel run"
   ```

3. 测试本地服务：
   ```bash
   curl http://localhost:3000
   curl http://localhost:4000
   curl http://localhost:8000/api/timeline/
   ```

4. 重启隧道：
   ```bash
   pkill -f "cloudflared tunnel run"
   cloudflared tunnel run history-river-dev
   ```

### 问题 2: 前端显示 403 错误

这通常是 Vite 的 `allowedHosts` 配置问题。已经在 `vite.config.ts` 中配置好了。

如果仍有问题，检查配置：
```bash
cat history_river/vite.config.ts | grep -A 5 allowedHosts
```

### 问题 3: DNS 解析失败

```bash
# 验证 DNS 记录
nslookup history-frontend.aigc24.com

# 清除 DNS 缓存
sudo dscacheutil -flushcache
```

---

## 📊 监控和维护

### 设置开机自启动

#### PM2 服务自启动

```bash
# 保存当前 PM2 进程列表
pm2 save

# 生成启动脚本
pm2 startup

# 按照提示执行命令（通常需要 sudo）
```

#### Cloudflare 隧道自启动

```bash
# 安装为系统服务
sudo cloudflared service install

# 启动服务
sudo cloudflared service start

# 查看状态
sudo cloudflared service status
```

### 定期检查

建议每天检查一次服务状态：
```bash
./cloudflare-status.sh
```

---

## 🔐 安全建议

1. **不要分享凭证文件**
   - `~/.cloudflared/cert.pem`
   - `~/.cloudflared/d77ac484-fb84-492c-9941-55a3b6f3deaa.json`

2. **定期更新 cloudflared**
   ```bash
   brew upgrade cloudflared
   ```

3. **监控访问日志**
   ```bash
   pm2 logs | grep -i error
   ```

4. **使用 Cloudflare 防护功能**
   - 在 Cloudflare 仪表板中启用 WAF
   - 配置速率限制
   - 启用 DDoS 防护

---

## 📚 相关文档

- [Cloudflare 隧道快速开始](./CLOUDFLARE_QUICK_START.md)
- [Cloudflare 隧道详细配置](./CLOUDFLARE_TUNNEL_SETUP.md)
- [Cloudflare 使用示例](./CLOUDFLARE_USAGE_EXAMPLES.md)
- [项目 README](./history_river/README.md)

---

## 🎯 下一步

1. ✅ 在浏览器中访问 https://history.aigc24.com
2. ✅ 在手机上测试访问
3. ✅ 分享链接给团队成员
4. ⏳ 配置开机自启动（可选）
5. ⏳ 在 Cloudflare 仪表板配置安全规则（可选）

---

**配置完成时间**: 2025-11-27
**最后更新**: 2025-11-27 19:30 (域名更新为 history.aigc24.com)
**配置人员**: Augment AI Assistant
**状态**: ✅ 运行正常

如有问题，请运行 `./cloudflare-status.sh` 检查状态或查看相关文档。


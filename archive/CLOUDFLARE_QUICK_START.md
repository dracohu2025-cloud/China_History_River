# Cloudflare 隧道快速开始指南

## 5 分钟快速设置

### 步骤 1: 安装 cloudflared (1 分钟)

```bash
brew install cloudflare/cloudflare/cloudflared
cloudflared --version
```

### 步骤 2: 认证 (2 分钟)

```bash
cloudflared tunnel login
# 浏览器会打开，选择你的 Cloudflare 账户和域名
```

### 步骤 3: 创建隧道 (1 分钟)

```bash
cloudflared tunnel create history-river-dev
# 保存输出的 Tunnel ID
```

### 步骤 4: 配置隧道 (1 分钟)

编辑 `~/.cloudflared/config.yml`：

```yaml
tunnel: history-river-dev
credentials-file: /Users/dracohu/.cloudflared/history-river-dev.json

ingress:
  - hostname: frontend.yourdomain.com
    service: http://localhost:3000
  - hostname: api.yourdomain.com
    service: http://localhost:4000
  - hostname: timeline.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
```

**替换 `yourdomain.com` 为你的实际域名**

### 步骤 5: 配置 DNS (在 Cloudflare 仪表板)

添加 3 条 CNAME 记录：

```
frontend  CNAME  <tunnel-id>.cfargotunnel.com
api       CNAME  <tunnel-id>.cfargotunnel.com
timeline  CNAME  <tunnel-id>.cfargotunnel.com
```

或使用命令行：

```bash
cloudflared tunnel route dns history-river-dev frontend.yourdomain.com
cloudflared tunnel route dns history-river-dev api.yourdomain.com
cloudflared tunnel route dns history-river-dev timeline.yourdomain.com
```

### 步骤 6: 启动隧道

```bash
# 方式 1: 前台运行 (测试)
cloudflared tunnel run history-river-dev

# 方式 2: 后台运行 (生产)
sudo cloudflared service install
sudo cloudflared service start
```

### 步骤 7: 测试

```bash
# 测试前端
curl https://frontend.yourdomain.com

# 测试 API
curl https://api.yourdomain.com

# 测试 Timeline
curl https://timeline.yourdomain.com
```

---

## 常用命令速查表

| 命令 | 说明 |
|------|------|
| `cloudflared tunnel login` | 认证 Cloudflare 账户 |
| `cloudflared tunnel create <name>` | 创建新隧道 |
| `cloudflared tunnel list` | 列出所有隧道 |
| `cloudflared tunnel run <name>` | 运行隧道 |
| `cloudflared tunnel delete <name>` | 删除隧道 |
| `cloudflared tunnel route dns <name> <hostname>` | 配置 DNS |
| `cloudflared tunnel status <name>` | 查看隧道状态 |

---

## 使用脚本快速管理

```bash
# 进入项目目录
cd history_river

# 使脚本可执行
chmod +x scripts/cloudflare-tunnel.sh

# 启动隧道
./scripts/cloudflare-tunnel.sh start

# 查看状态
./scripts/cloudflare-tunnel.sh status

# 查看日志
./scripts/cloudflare-tunnel.sh logs

# 测试连接
./scripts/cloudflare-tunnel.sh test yourdomain.com
```

---

## 故障排查

### 隧道无法连接

```bash
# 查看详细日志
cloudflared tunnel run history-river-dev --loglevel debug

# 检查本地服务是否运行
lsof -i :3000
lsof -i :4000
lsof -i :8000
```

### DNS 解析失败

```bash
# 验证 DNS 记录
nslookup frontend.yourdomain.com

# 清除 DNS 缓存 (macOS)
sudo dscacheutil -flushcache
```

### 403 Forbidden 错误

- 检查 DNS 记录是否正确配置
- 确保隧道凭证文件存在
- 重新运行 `cloudflared tunnel login`

---

## 下一步

- 详细配置: 查看 `CLOUDFLARE_TUNNEL_SETUP.md`
- 环境变量: 复制 `.env.cloudflare.example` 为 `.env.cloudflare`
- 生产部署: 配置系统服务自动启动隧道

---

**提示**: 在开发过程中，你可以同时运行本地开发服务器和 Cloudflare 隧道，这样既可以在本地调试，也可以通过隧道 URL 分享给他人。


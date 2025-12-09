# Cloudflare 隧道配置指南 - History River 项目

## 概述

本指南将帮助你在 MacMini M4 本地开发机上配置 Cloudflare 隧道，实现 IP 穿透，使外网可以访问你的本地开发环境。

### 项目服务架构
- **前端**: Vite 开发服务器 (端口 3000)
- **Express 服务器**: AI 内容生成 API (端口 4000)
- **Django 后端**: 时间线数据 API (端口 8000)

---

## 第一步：安装 Cloudflare Tunnel (cloudflared)

### 1.1 使用 Homebrew 安装

```bash
# 安装 cloudflared
brew install cloudflare/cloudflare/cloudflared

# 验证安装
cloudflared --version
```

### 1.2 验证安装成功

```bash
which cloudflared
# 应该输出: /usr/local/bin/cloudflared
```

---

## 第二步：Cloudflare 账户配置

### 2.1 登录 Cloudflare

```bash
# 这会打开浏览器进行认证
cloudflared tunnel login
```

- 选择你的 Cloudflare 账户
- 选择要使用的域名（例如：example.com）
- 授权 cloudflared 访问你的账户

### 2.2 验证认证

```bash
# 查看已认证的账户
ls ~/.cloudflared/
# 应该看到 cert.pem 和 tunnel 配置文件
```

---

## 第三步：创建隧道配置文件

### 3.1 创建配置目录

```bash
mkdir -p ~/.cloudflared
cd ~/.cloudflared
```

### 3.2 创建 config.yml 文件

在 `~/.cloudflared/config.yml` 中添加以下内容：

```yaml
# Cloudflare Tunnel 配置 - History River 项目
tunnel: history-river-dev
credentials-file: /Users/dracohu/.cloudflared/history-river-dev.json

ingress:
  # 前端应用 (Vite)
  - hostname: frontend.yourdomain.com
    service: http://localhost:3000
    
  # Express 服务器 (AI API)
  - hostname: api.yourdomain.com
    service: http://localhost:4000
    
  # Django 后端 (Timeline API)
  - hostname: timeline.yourdomain.com
    service: http://localhost:8000
    
  # 默认路由 - 如果没有匹配的主机名
  - service: http_status:404
```

**注意**: 将 `yourdomain.com` 替换为你的实际 Cloudflare 域名

---

## 第四步：创建隧道

### 4.1 创建新隧道

```bash
cloudflared tunnel create history-river-dev
```

输出示例：
```
Tunnel credentials written to /Users/dracohu/.cloudflared/history-river-dev.json
Tunnel ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**保存 Tunnel ID**，后续需要使用

### 4.2 验证隧道创建

```bash
cloudflared tunnel list
```

---

## 第五步：配置 DNS 记录

### 5.1 在 Cloudflare 仪表板配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的域名
3. 进入 **DNS** 部分
4. 添加以下 CNAME 记录：

| 类型 | 名称 | 目标 | TTL |
|------|------|------|-----|
| CNAME | frontend | `<tunnel-id>.cfargotunnel.com` | Auto |
| CNAME | api | `<tunnel-id>.cfargotunnel.com` | Auto |
| CNAME | timeline | `<tunnel-id>.cfargotunnel.com` | Auto |

其中 `<tunnel-id>` 是你在第 4.1 步获得的 Tunnel ID

### 5.2 或使用命令行配置

```bash
# 为前端配置 DNS
cloudflared tunnel route dns history-river-dev frontend.yourdomain.com

# 为 API 配置 DNS
cloudflared tunnel route dns history-river-dev api.yourdomain.com

# 为 Timeline API 配置 DNS
cloudflared tunnel route dns history-river-dev timeline.yourdomain.com
```

---

## 第六步：启动隧道

### 6.1 前台运行（测试）

```bash
cloudflared tunnel run history-river-dev
```

你应该看到类似的输出：
```
2025-01-15T10:30:00Z INF Starting tunnel session
2025-01-15T10:30:00Z INF Registered tunnel connection
2025-01-15T10:30:00Z INF Tunnel running
```

### 6.2 后台运行（生产）

```bash
# 安装为系统服务
sudo cloudflared service install

# 启动服务
sudo cloudflared service start

# 查看服务状态
sudo cloudflared service status

# 查看日志
sudo log stream --predicate 'process == "cloudflared"'
```

---

## 第七步：测试连接

### 7.1 测试前端访问

```bash
curl https://frontend.yourdomain.com
```

### 7.2 测试 API 访问

```bash
curl https://api.yourdomain.com/health
curl https://timeline.yourdomain.com/api/timeline/
```

### 7.3 在浏览器中测试

- 前端: `https://frontend.yourdomain.com`
- API: `https://api.yourdomain.com`
- Timeline: `https://timeline.yourdomain.com`

---

## 第八步：更新前端配置

### 8.1 更新 vite.config.ts

如果需要在生产环境中使用隧道 URL，更新代理配置：

```typescript
// 开发环境：使用本地 localhost
// 生产环境：使用 Cloudflare 隧道 URL

const isDev = mode === 'development';

proxy: {
  '/api': isDev ? 'http://localhost:4000' : 'https://api.yourdomain.com',
  '/timeline-api': {
    target: isDev ? 'http://localhost:8000' : 'https://timeline.yourdomain.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/timeline-api/, '/api/timeline')
  }
}
```

---

## 常见问题排查

### 问题 1: 隧道无法连接

```bash
# 检查 cloudflared 状态
cloudflared tunnel status history-river-dev

# 查看详细日志
cloudflared tunnel run history-river-dev --loglevel debug
```

### 问题 2: DNS 解析失败

```bash
# 验证 DNS 记录
nslookup frontend.yourdomain.com

# 清除 DNS 缓存
sudo dscacheutil -flushcache
```

### 问题 3: 本地服务无法访问

```bash
# 检查本地服务是否运行
lsof -i :3000  # 检查 Vite
lsof -i :4000  # 检查 Express
lsof -i :8000  # 检查 Django
```

---

## 高级配置

### 使用 systemd 自动启动（Linux）

对于 macOS，使用 LaunchAgent：

```bash
# 创建 plist 文件
sudo nano /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
```

内容：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.cloudflared</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>history-river-dev</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/var/log/cloudflared.err</string>
    <key>StandardOutPath</key>
    <string>/var/log/cloudflared.log</string>
</dict>
</plist>
```

### 启用 Cloudflare 防护

在 Cloudflare 仪表板中为隧道启用：
- DDoS 防护
- WAF 规则
- 速率限制
- 地理位置限制

---

## 清理和卸载

### 删除隧道

```bash
cloudflared tunnel delete history-river-dev
```

### 卸载 cloudflared

```bash
brew uninstall cloudflare/cloudflare/cloudflared
```

---

## 参考资源

- [Cloudflare Tunnel 官方文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [cloudflared CLI 参考](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)
- [Cloudflare 隧道配置示例](https://github.com/cloudflare/cloudflared/tree/master/examples)

---

**最后更新**: 2025-01-15
**适用版本**: cloudflared 2024.x+


# Cloudflare 隧道使用示例

本文档提供 History River 项目中 Cloudflare 隧道的实际使用示例和最佳实践。

## 场景 1: 首次设置隧道

### 完整流程

```bash
# 1. 进入项目目录
cd /Users/dracohu/REPO/history_river_November_2025

# 2. 安装 cloudflared
make tunnel-install

# 3. 认证 Cloudflare 账户（会打开浏览器）
make tunnel-login
# 在浏览器中选择你的域名，例如：example.com

# 4. 创建隧道
make tunnel-create
# 记录输出的 Tunnel ID，例如：a1b2c3d4-e5f6-7890-abcd-ef1234567890

# 5. 配置 DNS 记录
make tunnel-dns CLOUDFLARE_DOMAIN=example.com
# 这会创建三条 CNAME 记录：
#   frontend.example.com
#   api.example.com
#   timeline.example.com

# 6. 复制并编辑配置文件
cp history_river/cloudflared-config.yml.example ~/.cloudflared/config.yml
# 编辑 ~/.cloudflared/config.yml，替换：
#   - <TUNNEL_NAME> -> history-river-dev
#   - <YOUR_USERNAME> -> dracohu
#   - yourdomain.com -> example.com

# 7. 启动所有本地服务
# 在终端 1: 启动前端
cd history_river && npm run dev

# 在终端 2: 启动 Express API
cd history_river && npm run server

# 在终端 3: 启动 Django
cd history_river/dj_backend && python manage.py runserver

# 在终端 4: 启动隧道
make tunnel-start CLOUDFLARE_DOMAIN=example.com
```

### 验证设置

```bash
# 测试连接
make tunnel-test CLOUDFLARE_DOMAIN=example.com

# 或手动测试
curl https://frontend.example.com
curl https://api.example.com
curl https://timeline.example.com/api/timeline/
```

---

## 场景 2: 日常开发工作流

### 启动开发环境

```bash
# 方式 1: 使用 Makefile（推荐）
make tunnel-start CLOUDFLARE_DOMAIN=example.com

# 方式 2: 使用 npm 脚本
cd history_river
npm run tunnel:start

# 方式 3: 直接使用脚本
./history_river/scripts/cloudflare-tunnel.sh start
```

### 查看隧道状态

```bash
# 使用 Makefile
make tunnel-status

# 使用 npm
npm run tunnel:status

# 使用脚本
./history_river/scripts/cloudflare-tunnel.sh status
```

### 停止隧道

```bash
# 使用 Makefile
make tunnel-stop

# 使用 npm
npm run tunnel:stop

# 停止所有服务
make all-stop
```

---

## 场景 3: 调试和故障排查

### 查看详细日志

```bash
# 使用 Makefile（调试模式）
make tunnel-logs

# 使用 npm
npm run tunnel:logs

# 使用脚本
./history_river/scripts/cloudflare-tunnel.sh logs
```

### 检查本地服务

```bash
# 检查端口占用
lsof -i :3000  # Vite
lsof -i :4000  # Express
lsof -i :8000  # Django

# 检查进程
ps aux | grep vite
ps aux | grep "node server"
ps aux | grep "python manage.py"
ps aux | grep cloudflared
```

### 重启隧道

```bash
# 停止隧道
make tunnel-stop

# 等待几秒
sleep 3

# 重新启动
make tunnel-start CLOUDFLARE_DOMAIN=example.com
```

---

## 场景 4: 团队协作演示

### 准备演示环境

```bash
# 1. 确保所有服务运行正常
cd history_river
npm run dev &          # 后台运行前端
npm run server &       # 后台运行 API
cd dj_backend && python manage.py runserver &  # 后台运行 Django

# 2. 启动隧道
make tunnel-start CLOUDFLARE_DOMAIN=example.com

# 3. 分享链接给团队
echo "前端: https://frontend.example.com"
echo "API: https://api.example.com"
echo "Timeline: https://timeline.example.com"
```

### 演示结束后清理

```bash
# 停止所有服务
make all-stop

# 或手动停止
pkill -f vite
pkill -f "node server"
pkill -f "python manage.py"
pkill -f cloudflared
```

---

## 场景 5: 移动设备测试

### 在手机上测试应用

```bash
# 1. 启动隧道
make tunnel-start CLOUDFLARE_DOMAIN=example.com

# 2. 在手机浏览器中访问
# https://frontend.example.com

# 3. 查看实时日志
make tunnel-logs
# 你会看到来自移动设备的请求
```

---

## 场景 6: Webhook 测试

### 接收第三方服务回调

```bash
# 1. 启动隧道
make tunnel-start CLOUDFLARE_DOMAIN=example.com

# 2. 配置第三方服务的 Webhook URL
# 例如：https://api.example.com/webhook

# 3. 监控请求
make tunnel-logs
# 查看 Webhook 请求的详细信息
```

---

## 场景 7: 临时分享开发版本

### 快速分享给客户

```bash
# 1. 启动隧道（前台运行，便于监控）
make tunnel-start CLOUDFLARE_DOMAIN=example.com

# 2. 分享链接
# 前端: https://frontend.example.com

# 3. 演示结束后按 Ctrl+C 停止
```

---

## 最佳实践

### 1. 使用环境变量

创建 `.env.cloudflare` 文件：

```bash
# 复制模板
cp history_river/.env.cloudflare.example history_river/.env.cloudflare

# 编辑配置
CLOUDFLARE_DOMAIN=example.com
CLOUDFLARE_TUNNEL_NAME=history-river-dev
```

### 2. 定期检查隧道状态

```bash
# 添加到 crontab（每小时检查一次）
0 * * * * cd /Users/dracohu/REPO/history_river_November_2025 && make tunnel-status
```

### 3. 日志管理

```bash
# 将日志输出到文件
make tunnel-start CLOUDFLARE_DOMAIN=example.com > tunnel.log 2>&1 &

# 实时查看日志
tail -f tunnel.log
```

### 4. 安全建议

- 不要在生产环境使用开发隧道
- 定期更新 cloudflared 版本
- 使用 Cloudflare 的访问控制功能
- 监控异常流量

---

## 常见问题

### Q: 隧道连接失败怎么办？

```bash
# 1. 检查 cloudflared 是否运行
ps aux | grep cloudflared

# 2. 检查配置文件
cat ~/.cloudflared/config.yml

# 3. 重新认证
make tunnel-login

# 4. 重新启动
make tunnel-stop
make tunnel-start CLOUDFLARE_DOMAIN=example.com
```

### Q: DNS 解析失败？

```bash
# 1. 验证 DNS 记录
nslookup frontend.example.com

# 2. 清除 DNS 缓存
sudo dscacheutil -flushcache

# 3. 等待 DNS 传播（可能需要几分钟）
```

### Q: 如何更改域名？

```bash
# 1. 删除旧的 DNS 记录（在 Cloudflare 仪表板）

# 2. 配置新的 DNS 记录
make tunnel-dns CLOUDFLARE_DOMAIN=newdomain.com

# 3. 更新配置文件
vim ~/.cloudflared/config.yml
# 替换所有 olddomain.com 为 newdomain.com

# 4. 重启隧道
make tunnel-stop
make tunnel-start CLOUDFLARE_DOMAIN=newdomain.com
```

---

## 参考资源

- [Cloudflare 隧道快速开始](./CLOUDFLARE_QUICK_START.md)
- [Cloudflare 隧道详细配置](./CLOUDFLARE_TUNNEL_SETUP.md)
- [项目 README](./history_river/README.md)


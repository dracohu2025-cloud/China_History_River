<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# History River - 5000 年中华文明历史长河

一个交互式的历史可视化应用，通过河流隐喻展示 5000 年中华文明的演进历程。

## 项目特性

- 🌊 **交互式河流可视化**: 基于 D3.js 的 2D 时间线，朝代如河流般流动
- 🤖 **AI 驱动的历史内容**: 集成 OpenRouter API 生成智能历史摘要
- 🎙️ **播客系统**: 多说话人音频内容，Supabase 后端支持
- 📱 **多页面架构**: 主可视化页面、独立播放器和管理界面
- 🔄 **双后端系统**: Node.js Express + Django REST API

## 技术栈

- **前端**: React 19 + TypeScript + Vite + D3.js + Tailwind CSS
- **后端**: Node.js Express (端口 4000) + Django REST API (端口 8000)
- **数据库**: PostgreSQL (通过 Supabase)
- **AI**: OpenRouter API (DeepSeek V3.2 模型)

## 本地开发

### 前置要求

- Node.js 18+
- Python 3.9+
- PostgreSQL (或使用 Supabase)

### 快速开始

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **配置环境变量**:

   复制 `.env.local.example` 为 `.env.local` 并填入你的 API 密钥：
   ```bash
   OpenRouter_API_KEY=sk-or-v1-...
   Default_LLM_Model=deepseek/deepseek-v3.2-exp
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. **启动前端开发服务器** (端口 3000):
   ```bash
   npm run dev
   ```

4. **启动 Express 服务器** (端口 4000):
   ```bash
   npm run server
   ```

5. **启动 Django 后端** (端口 8000):
   ```bash
   cd dj_backend
   ./setup_django.sh
   python manage.py runserver
   ```

6. **访问应用**:
   - 前端: http://localhost:3000
   - Express API: http://localhost:4000
   - Django API: http://localhost:8000

## Cloudflare 隧道配置（外网访问）

如果你需要通过外网访问本地开发环境，可以使用 Cloudflare 隧道：

### 快速设置

```bash
# 1. 安装 cloudflared
make tunnel-install

# 2. 认证 Cloudflare 账户
make tunnel-login

# 3. 创建隧道
make tunnel-create

# 4. 配置 DNS
make tunnel-dns CLOUDFLARE_DOMAIN=yourdomain.com

# 5. 启动隧道
make tunnel-start CLOUDFLARE_DOMAIN=yourdomain.com
```

### 使用 npm 脚本

```bash
# 启动隧道
npm run tunnel:start

# 查看状态
npm run tunnel:status

# 查看日志
npm run tunnel:logs

# 停止隧道
npm run tunnel:stop
```

### 详细文档

- 📖 [Cloudflare 隧道快速开始](../CLOUDFLARE_QUICK_START.md)
- 📖 [Cloudflare 隧道详细配置](../CLOUDFLARE_TUNNEL_SETUP.md)

## 可用脚本

### 前端开发
- `npm run dev` - 启动 Vite 开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建

### 后端服务
- `npm run server` - 启动 Express API 服务器
- `npm run db:inspect` - 检查 Supabase 数据库

### Cloudflare 隧道
- `npm run tunnel:start` - 启动隧道
- `npm run tunnel:stop` - 停止隧道
- `npm run tunnel:status` - 查看隧道状态
- `npm run tunnel:logs` - 查看隧道日志
- `npm run tunnel:config` - 显示隧道配置
- `npm run tunnel:list` - 列出所有隧道

### Makefile 命令
- `make help` - 显示所有可用命令
- `make all-dev` - 启动所有开发服务
- `make all-stop` - 停止所有开发服务
- `make tunnel-*` - 隧道管理命令（详见 `make help`）

## 项目结构

```
history_river/
├── components/          # React 组件
│   ├── RiverCanvas.tsx # 主可视化组件
│   └── ...
├── pages/              # 页面组件
├── services/           # API 服务
├── data/               # 历史数据
├── server/             # Express 后端
├── dj_backend/         # Django 后端
└── scripts/            # 工具脚本
```

## 部署

### 前端部署 (Vercel)
```bash
npm run build
# 部署到 Vercel
```

### Django 后端部署 (UCloud)
```bash
cd dj_backend
./start_prod.sh
```

## 文档

- [AGENTS.md](./AGENTS.md) - 项目开发指南
- [DJANGO_INTEGRATION.md](./DJANGO_INTEGRATION.md) - Django 集成说明
- [feature_iteration.md](./feature_iteration.md) - 功能迭代记录

## 许可证

MIT

## 联系方式

如有问题，请提交 Issue 或 Pull Request。

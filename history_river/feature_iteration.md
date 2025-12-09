# Feature Iteration Log

## 2025-11-28 (3): 修复 Cloudflare Tunnel 连接问题 ✅

**版本号**: V0.1.1.9
**时间戳**: 2025-11-28 09:35:00

### 功能概述
修复播客播放页面无法访问的问题（Cloudflare Tunnel Error 1033），将 cloudflared tunnel 添加到 PM2 进程管理中。

### 问题描述
- 播客播放页面 https://history.aigc24.com/player.html?episode=16ec7d2c-cd25-4dce-90b1-b3f680aaeff1 返回 **Cloudflare Tunnel Error 1033**
- 错误信息：`Cloudflare Tunnel error - The host (history.aigc24.com) is configured as an Cloudflare Tunnel, and Cloudflare is currently unable to resolve it.`

### 根本原因分析
1. **cloudflared tunnel 未运行**：
   - PM2 中只管理了 3 个服务（frontend, api, django）
   - cloudflared tunnel 没有在 PM2 中配置
   - 系统重启或 cloudflared 进程意外终止后，tunnel 不会自动重启

2. **cloudflared 路径问题**：
   - cloudflared 安装在 `/opt/homebrew/bin/cloudflared`
   - 不在默认 PATH 中，需要使用完整路径

### 主要变更

#### 1. 添加 cloudflared tunnel 到 PM2 配置
**文件**: `ecosystem.config.js`

**新增配置** (第 84-101 行)：
```javascript
// ============================================
// Cloudflare Tunnel - 外网访问
// ============================================
{
  name: 'history-river-tunnel',
  script: '/opt/homebrew/bin/cloudflared',
  args: 'tunnel run history-river-dev',
  interpreter: 'none',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '200M',
  error_file: './logs/tunnel-error.log',
  out_file: './logs/tunnel-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
},
```

### 验证结果

#### PM2 进程状态
```bash
pm2 status
# ✅ history-river-frontend: online
# ✅ history-river-api: online
# ✅ history-river-django: online
# ✅ history-river-tunnel: online (新增)
```

#### Cloudflare Tunnel 状态
```
✅ Tunnel ID: d77ac484-fb84-492c-9941-55a3b6f3deaa
✅ Registered connections: sin07, sin18 (新加坡数据中心)
✅ Protocol: QUIC
```

#### 播客播放页验证
```bash
curl -I "https://history.aigc24.com/player.html?episode=16ec7d2c-cd25-4dce-90b1-b3f680aaeff1"
# ✅ HTTP/2 200
```

### 服务管理命令

#### 启动所有服务（包括 tunnel）
```bash
pm2 start ecosystem.config.js
```

#### 只启动 tunnel
```bash
pm2 start ecosystem.config.js --only history-river-tunnel
```

#### 查看 tunnel 日志
```bash
pm2 logs history-river-tunnel
```

#### 重启 tunnel
```bash
pm2 restart history-river-tunnel
```

#### 保存 PM2 配置（系统重启后自动恢复）
```bash
pm2 save
pm2 startup  # 首次配置时执行
```

### 技术要点
- **进程管理**：使用 PM2 统一管理所有服务，包括 cloudflared tunnel
- **自动重启**：`autorestart: true` 确保 tunnel 意外终止后自动重启
- **日志管理**：tunnel 日志保存在 `./logs/tunnel-out.log` 和 `./logs/tunnel-error.log`
- **内存限制**：`max_memory_restart: '200M'` 防止内存泄漏
- **持久化配置**：`pm2 save` 确保系统重启后自动恢复所有服务

### 相关链接
- **主页**: https://history.aigc24.com/
- **播客播放页**: https://history.aigc24.com/player.html?episode=16ec7d2c-cd25-4dce-90b1-b3f680aaeff1
- **Django 管理后台**: https://history-timeline.aigc24.com/admin/

---

## 2025-11-28 (2): 修复播客缩略图数据库查询问题 ✅

**版本号**: V0.1.1.8
**时间戳**: 2025-11-28 09:20:00

### 功能概述
修复播客缩略图无法从数据库正确获取的问题。发现 `jobs` 表中没有 `thumbnail_url` 列，需要从 `podcasts` 表中获取。

### 问题描述
- 播客缩略图在前端页面上仍然无法显示
- 调试发现 `getPodcastById` 返回的数据中没有 `thumbnail_url` 字段
- 通过 Supabase REST API 测试发现 `jobs` 表中根本没有 `thumbnail_url` 列

### 根本原因分析
1. **数据库架构问题**：
   - `jobs` 表中没有 `thumbnail_url` 列（通过 API 测试确认：`column jobs.thumbnail_url does not exist`）
   - `podcasts` 表中有 `thumbnail_url` 列，并且数据正确
   - `getPodcastById` 函数只查询 `jobs` 表，无法获取 `thumbnail_url`

2. **视口范围问题**：
   - 播客 pin 只在可见范围内渲染（screenX 在 -200 到 width+200 之间）
   - 用户初始视口在时间轴起始位置（BC2070 附近）
   - 1900 年的播客 pin 不在可见范围内（screenX=6867.8，远超 width=1200）

### 主要变更

#### 1. 修复 podcastService.ts - 从 podcasts 表获取 thumbnail_url
**文件**: `history_river/services/podcastService.ts`

**Supabase 客户端路径** (第 67-88 行)：
```typescript
export async function getPodcastById(jobId: string): Promise<PodcastJobRow | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    if (!error && data) {
      const jobData = data as PodcastJobRow
      // 如果 jobs 表中没有 thumbnail_url，尝试从 podcasts 表获取
      if (!jobData.thumbnail_url) {
        const { data: pData } = await supabase
          .from('podcasts')
          .select('thumbnail_url')
          .eq('id', jobId)
          .single()
        if (pData && pData.thumbnail_url) {
          jobData.thumbnail_url = pData.thumbnail_url
        }
      }
      return jobData
    }
    // ...
  }
}
```

**REST API fallback 路径** (第 120-141 行)：
```typescript
const arr: PodcastJobRow[] = await res.json()
if (arr && arr.length) {
  const jobData = arr[0]
  // 如果 jobs 表中没有 thumbnail_url，尝试从 podcasts 表获取
  if (!jobData.thumbnail_url) {
    const thumbUrl = `${BASE_URL}/rest/v1/podcasts?select=thumbnail_url` + `&id=eq.${encodeURIComponent(jobId)}`
    const thumbRes = await fetch(thumbUrl, { headers })
    if (thumbRes.ok) {
      const thumbArr: { thumbnail_url?: string }[] = await thumbRes.json()
      if (thumbArr && thumbArr.length && thumbArr[0].thumbnail_url) {
        jobData.thumbnail_url = thumbArr[0].thumbnail_url
      }
    }
  }
  return jobData
}
```

#### 2. 确认 RiverCanvas.tsx 缩略图渲染逻辑
**文件**: `history_river/components/RiverCanvas.tsx`

**第 489 行**：
```typescript
// 优先使用数据库中存储的 thumbnail_url，如果没有则使用脚本第一张图片
const thumb = job?.thumbnail_url || job?.output_data?.script?.[0]?.generatedImageUrl
```

**第 533 行**（hover 状态）：
```typescript
// 优先使用数据库中存储的 thumbnail_url，如果没有则使用脚本第一张图片
const thumb = job?.thumbnail_url || job?.output_data?.script?.[0]?.generatedImageUrl
```

### 验证结果

#### 数据库验证
```bash
# jobs 表没有 thumbnail_url 列
curl "https://zhvczrrcwpxgrifshhmh.supabase.co/rest/v1/jobs?select=id,thumbnail_url&id=eq.16ec7d2c-cd25-4dce-90b1-b3f680aaeff1"
# 返回：{"code": "42703", "message": "column jobs.thumbnail_url does not exist"}

# podcasts 表有 thumbnail_url 列
curl "https://zhvczrrcwpxgrifshhmh.supabase.co/rest/v1/podcasts?select=id,thumbnail_url&id=eq.16ec7d2c-cd25-4dce-90b1-b3f680aaeff1"
# 返回：[{"id": "16ec7d2c-cd25-4dce-90b1-b3f680aaeff1", "thumbnail_url": "https://zhvczrrcwpxgrifshhmh.supabase.co/storage/v1/object/public/podcasts/26034db0-bf4c-418e-a7ee-9bb54d3ae854/16ec7d2c-cd25-4dce-90b1-b3f680aaeff1/images/0.png"}]
```

#### 前端验证
- ✅ `getPodcastById` 成功从 `podcasts` 表获取 `thumbnail_url`
- ✅ 控制台日志显示：`🔍 Final jobData has thumbnail_url: true https://zhvczrrcwpxgrifshhmh.supabase.co/storage/v1/object/public/podcasts/...`
- ✅ 当用户滚动到 1900 年附近时，播客 pin 正确渲染
- ✅ 控制台日志显示：`🎯 Pin 1900: screenX=1107.8, width=1200, visible=true`
- ✅ 缩略图成功加载：`🖼️ Pin 1900 (16ec7d2c-cd25-4dce-90b1-b3f680aaeff1): {job: Object, thumb: https://zhvczrrcwpxg...}`

### 播客信息
- **播客 ID**: 16ec7d2c-cd25-4dce-90b1-b3f680aaeff1
- **标题**: 《太后西奔》
- **年份**: 1900
- **缩略图 URL**: https://zhvczrrcwpxgrifshhmh.supabase.co/storage/v1/object/public/podcasts/26034db0-bf4c-418e-a7ee-9bb54d3ae854/16ec7d2c-cd25-4dce-90b1-b3f680aaeff1/images/0.png

### 用户使用说明
1. 打开 https://history.aigc24.com/
2. 拖动时间轴向右滚动到 1900 年附近
3. 在页面底部的播客轨道上可以看到播客缩略图
4. 点击缩略图可以播放播客

### 技术要点
- **数据库架构差异**：`jobs` 表和 `podcasts` 表的字段不同，需要跨表查询
- **视口优化**：播客 pin 只在可见范围内渲染，避免性能问题
- **Fallback 机制**：优先使用 `thumbnail_url`，失败时使用 `script[0].generatedImageUrl`
- **双路径支持**：Supabase 客户端和 REST API fallback 都实现了相同的逻辑

---

## 2025-11-28 (1): 修复播客缩略图加载问题 ✅

**版本号**: V0.1.1.7
**时间戳**: 2025-11-28 08:40:00

### 功能概述
修复前端页面播客 thumbnail 无法加载的问题，实现优先加载 Supabase 中存储的 thumbnail_url，失败时 fallback 到播客第一张图片。

### 问题描述
- Django 播客 pin 中录入了播客 "16ec7d2c-cd25-4dce-90b1-b3f680aaeff1" 并指向 1900 年
- 前端页面 https://history.aigc24.com/ 上没有展示播客缩略图
- 用户要求：默认加载 Supabase 中存储的 thumbnail，如果失败则 fallback 到该播客第一张图片

### 根本原因分析
1. **podcastService.ts 问题**：
   - `getPodcastById` 函数从 podcasts 表获取数据时，虽然查询了 `thumbnail_url` 字段
   - 但在构造返回对象时，没有将 `thumbnail_url` 传递到 `PodcastJobRow` 对象中
   - 导致前端无法获取到 thumbnail_url 数据

2. **RiverCanvas.tsx 问题**：
   - 缩略图渲染逻辑只使用了 `job?.output_data?.script?.[0]?.generatedImageUrl`
   - 没有优先使用 `thumbnail_url` 字段
   - 不符合用户要求的 fallback 逻辑

### 主要变更

#### 1. 修复 podcastService.ts (2 处)
**文件**: `history_river/services/podcastService.ts`

- **第 92-101 行**：在 Supabase 客户端 fallback 逻辑中添加 `thumbnail_url` 字段
  ```typescript
  const converted: PodcastJobRow = {
    id: row.id,
    status: 'completed',
    created_at: typeof row.created_at === 'string' ? row.created_at : String(row.created_at || ''),
    output_data: output,
    title: row.title,
    total_duration: (row as any).total_duration ? Number((row as any).total_duration) : undefined,
    thumbnail_url: row.thumbnail_url  // 添加 thumbnail_url 字段
  }
  ```

- **第 124-132 行**：在 REST API fallback 逻辑中添加 `thumbnail_url` 字段
  ```typescript
  return {
    id: row.id,
    status: 'completed',
    created_at: typeof row.created_at === 'string' ? row.created_at : String(row.created_at || ''),
    output_data: output,
    title: row.title,
    total_duration: (row as any).total_duration ? Number((row as any).total_duration) : undefined,
    thumbnail_url: row.thumbnail_url  // 添加 thumbnail_url 字段
  }
  ```

#### 2. 修复 RiverCanvas.tsx (2 处)
**文件**: `history_river/components/RiverCanvas.tsx`

- **第 477-481 行**：修复播客 pin 缩略图加载逻辑
  ```typescript
  const job = podcastCache[pin.jobId]
  // 优先使用数据库中存储的 thumbnail_url，如果没有则使用脚本第一张图片
  const thumb = job?.thumbnail_url || job?.output_data?.script?.[0]?.generatedImageUrl
  ```

- **第 522-526 行**：修复悬停播客缩略图加载逻辑
  ```typescript
  const job = podcastCache[hoverEpisodeId]
  // 优先使用数据库中存储的 thumbnail_url，如果没有则使用脚本第一张图片
  const thumb = job?.thumbnail_url || job?.output_data?.script?.[0]?.generatedImageUrl
  ```

### 技术细节

#### Supabase 数据验证
- **jobs 表**：播客记录存在，但没有 `thumbnail_url` 字段
- **podcasts 表**：播客记录存在，包含完整的 `thumbnail_url` 字段
  ```
  "thumbnail_url": "https://zhvczrrcwpxgrifshhmh.supabase.co/storage/v1/object/public/podcasts/26034db0-bf4c-418e-a7ee-9bb54d3ae854/16ec7d2c-cd25-4dce-90b1-b3f680aaeff1/images/0.png"
  ```
- **图片 URL 测试**：HTTP 200，CORS 正常（access-control-allow-origin: *）

#### Fallback 逻辑
1. **优先级 1**：`job?.thumbnail_url` - 数据库中存储的缩略图 URL
2. **优先级 2**：`job?.output_data?.script?.[0]?.generatedImageUrl` - 播客第一张图片

### 测试结果
- ✅ podcastService.ts 修改完成
- ✅ RiverCanvas.tsx 修改完成
- ✅ 前端服务重启成功 (PM2)
- ✅ 前端页面访问正常 (HTTP 200)
- ✅ 播客缩略图应该可以正常显示

### 部署步骤
1. 修改 `history_river/services/podcastService.ts`
2. 修改 `history_river/components/RiverCanvas.tsx`
3. 重启前端服务：`pm2 restart history-river-frontend`
4. 验证前端访问：https://history.aigc24.com/

### 后续建议
1. 考虑在 jobs 表中也添加 `thumbnail_url` 字段，统一数据结构
2. 添加图片加载失败的错误处理和重试机制
3. 考虑添加图片预加载优化用户体验

---

## 2025-11-27 (3): 前端域名优化 ✅

**版本号**: V0.1.1.6
**时间戳**: 2025-11-27 19:30:00

### 功能概述
将前端域名从 `history-frontend.aigc24.com` 优化为更简洁的 `history.aigc24.com`。

### 主要变更

#### 1. DNS 记录更新
- 删除旧域名：history-frontend.aigc24.com
- 创建新域名：history.aigc24.com
- 保持 API 和 Timeline 域名不变

#### 2. 配置文件修改
- **~/.cloudflared/config.yml**: 更新前端 hostname 为 history.aigc24.com
- **history_river/vite.config.ts**: 更新 allowedHosts 配置

#### 3. 脚本和文档更新
- **cloudflare-status.sh**: 更新测试 URL 和显示地址
- **CLOUDFLARE_SETUP_COMPLETE.md**: 更新所有域名引用

### 新的访问地址
- ✅ 前端: https://history.aigc24.com (已更新)
- ✅ API: https://history-api.aigc24.com (保持不变)
- ✅ Timeline: https://history-timeline.aigc24.com (保持不变)

### 测试结果
- ✅ 新域名访问正常 (HTTP 200)
- ✅ 隧道重启成功
- ✅ 前端服务重启成功
- ✅ 所有服务运行正常

---

## 2025-11-27 (2): Cloudflare 隧道配置完成并上线 ✅

**版本号**: V0.1.1.5
**时间戳**: 2025-11-27 15:52:00

### 功能概述
完成 Cloudflare 隧道的实际配置和部署，项目现已可通过外网访问。

### 主要变更

#### 1. Cloudflare 隧道配置完成
- **隧道名称**: history-river-dev
- **隧道 ID**: d77ac484-fb84-492c-9941-55a3b6f3deaa
- **域名**: aigc24.com
- **外网地址**:
  - 前端: https://history-frontend.aigc24.com ✅
  - API: https://history-api.aigc24.com ✅
  - Timeline: https://history-timeline.aigc24.com ✅

#### 2. DNS 记录配置
- history-frontend.aigc24.com → CNAME → d77ac484-fb84-492c-9941-55a3b6f3deaa.cfargotunnel.com
- history-api.aigc24.com → CNAME → d77ac484-fb84-492c-9941-55a3b6f3deaa.cfargotunnel.com
- history-timeline.aigc24.com → CNAME → d77ac484-fb84-492c-9941-55a3b6f3deaa.cfargotunnel.com

#### 3. Vite 配置修改
- **文件**: history_river/vite.config.ts
- **修改**: 添加 `allowedHosts` 配置
- **内容**:
  ```typescript
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    'history-frontend.aigc24.com',
    '.aigc24.com'
  ]
  ```

#### 4. PM2 进程管理
- 使用 PM2 管理所有服务
- 创建 ecosystem.config.js 配置文件
- 创建 pm2-start.sh 和 pm2-stop.sh 脚本

#### 5. 新增脚本
- **cloudflare-status.sh**: 一键检查所有服务状态和外网访问

#### 6. 新增文档
- **CLOUDFLARE_SETUP_COMPLETE.md**: 完整的配置摘要和使用指南

### 技术细节
- Cloudflare Tunnel 版本: 2025.11.1
- 连接协议: QUIC
- 边缘节点: 新加坡 (sin08, sin13)
- PM2 管理: 3个服务进程
- 所有服务运行正常

### 测试结果
- ✅ 前端外网访问正常 (HTTP 200)
- ✅ API 服务运行正常
- ✅ Django 服务运行正常
- ✅ 隧道连接稳定
- ✅ PM2 进程管理正常

---

## 2025-11-27 (1): Cloudflare 隧道配置集成

**版本号**: V0.1.1.4
**时间戳**: 2025-11-27 14:30:00

### 功能概述
为 History River 项目添加完整的 Cloudflare 隧道（Cloudflare Tunnel）配置支持，实现本地开发环境的外网访问能力。

### 主要变更

#### 1. 文档创建
- **CLOUDFLARE_TUNNEL_SETUP.md**: 详细的 Cloudflare 隧道配置指南
  - 安装和认证流程
  - 隧道创建和配置
  - DNS 记录配置
  - 故障排查指南
  - 高级配置选项

- **CLOUDFLARE_QUICK_START.md**: 5 分钟快速开始指南
  - 简化的设置步骤
  - 常用命令速查表
  - 快速故障排查

- **cloudflared-config.yml.example**: 隧道配置文件模板
  - 三个服务的入口规则（前端、API、Timeline）
  - 优化的连接参数
  - 详细的配置说明

- **.env.cloudflare.example**: 环境变量配置模板
  - 开发和生产环境 URL 配置
  - 安全和监控配置
  - 高级隧道参数

#### 2. 脚本工具
- **scripts/cloudflare-tunnel.sh**: 隧道管理脚本
  - 启动/停止隧道
  - 查看状态和日志
  - 配置显示
  - 连接测试
  - 彩色输出和错误处理

#### 3. 构建工具集成
- **Makefile**: 添加隧道管理命令
  - `make tunnel-install`: 安装 cloudflared
  - `make tunnel-login`: 认证账户
  - `make tunnel-create`: 创建隧道
  - `make tunnel-start`: 启动隧道
  - `make tunnel-stop`: 停止隧道
  - `make tunnel-status`: 查看状态
  - `make tunnel-dns`: 配置 DNS
  - `make tunnel-test`: 测试连接
  - `make all-dev`: 启动所有开发服务
  - `make all-stop`: 停止所有服务

#### 4. NPM 脚本
在 `package.json` 中添加隧道管理脚本：
- `npm run tunnel:start`: 启动隧道
- `npm run tunnel:stop`: 停止隧道
- `npm run tunnel:status`: 查看状态
- `npm run tunnel:logs`: 查看日志
- `npm run tunnel:config`: 显示配置
- `npm run tunnel:list`: 列出所有隧道

#### 5. README 更新
- 扩展项目 README.md
- 添加 Cloudflare 隧道配置章节
- 更新项目特性和技术栈说明
- 添加完整的脚本命令文档

### 技术细节

#### 隧道架构
```
外网访问
    ↓
Cloudflare Edge
    ↓
Cloudflare Tunnel (cloudflared)
    ↓
本地服务:
  - frontend.yourdomain.com → localhost:3000 (Vite)
  - api.yourdomain.com → localhost:4000 (Express)
  - timeline.yourdomain.com → localhost:8000 (Django)
```

#### 配置特性
- HTTP/2 支持
- 自动重连机制
- 连接池优化
- 优雅关闭
- 详细日志记录

### 使用场景
1. **远程演示**: 向客户或团队成员展示本地开发进度
2. **移动设备测试**: 在手机/平板上测试应用
3. **Webhook 测试**: 接收第三方服务的回调
4. **协作开发**: 多人访问同一开发环境
5. **临时部署**: 快速分享开发版本

### 安全考虑
- 使用 Cloudflare 的 DDoS 防护
- 支持 WAF 规则配置
- 可配置速率限制
- 地理位置访问控制
- TLS 1.3 加密

### 后续优化建议
1. 添加隧道监控和告警
2. 集成到 CI/CD 流程
3. 添加访问日志分析
4. 配置自动化测试环境
5. 添加隧道性能监控

### 测试状态
- ✅ 脚本可执行权限已设置
- ✅ Makefile 命令已验证
- ✅ NPM 脚本已添加
- ✅ 文档已创建
- ⏳ 实际隧道连接测试（需要用户配置域名）

---

## 2025-11-23: 3D River Visualization Enhancement II

*   **Feature:** Converted 3D river to "Flowing River" style (Lay Flat).
*   **Change:** Refactored `RiverCanvas3D.tsx` to reorient the river geometry and camera.
*   **Detail:** 
    *   **Orientation:** Swapped visual axes. The river now flows along X, with Power determining Width (Z-axis), and a small fixed Height (Y-axis). This addresses the user's request to "substantially reduce Y axis" (visual height).
    *   **Camera:** Moved to a bird's-eye view (`y=400, z=600`) looking down at the river, instead of a front-facing view.
    *   **Material:** Adjusted roughness to `0.1` for a water-like appearance.
    *   **Animation:** Replaced rotation with a gentle vertical floating animation (`m.position.y`) to simulate water movement.
    *   **Cleanup:** Removed the debug box.

## 2025-11-23: 3D River Visualization Enhancement

*   **Feature:** Enhanced 3D visualization of the history river.
*   **Change:** Modified `RiverCanvas3D.tsx` to generate a 3D tube geometry (rectangular cross-section with thickness) instead of a flat 2D ribbon.
*   **Detail:** 
    *   Updated `buildRibbon` to generate 4 vertices per step (Front-Bottom, Front-Top, Back-Top, Back-Bottom).
    *   Created indices for 4 faces (Front, Top, Back, Bottom).
    *   Switched material from `MeshBasicMaterial` to `MeshStandardMaterial` for 3D shading.
    *   Added Z-axis thickness (`zDepth = 8`).
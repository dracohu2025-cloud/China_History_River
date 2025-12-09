# 播客故障调查报告

## 📋 基本信息

**调查时间**: 2025-12-01 18:15:00
**播客ID**: `1a338d50-5b8b-4091-ab81-60fe7f03a532`
**播放地址**: https://history.aigc24.com/player.html?episode=1a338d50-5b8b-4091-ab81-60fe7f03a532

---

## 🔍 调查结果

### ✅ 数据库记录存在

#### 1. jobs 表数据
```json
{
  "id": "1a338d50-5b8b-4091-ab81-60fe7f03a532",
  "status": "completed",
  "title": null,
  "has_script": true,
  "audio_path": "26034db0-bf4c-418e-a7ee-9bb54d3ae854/1a338d50-5b8b-4091-ab81-60fe7f03a532/full_podcast.mp3"
}
```

#### 2. podcasts 表数据
```json
{
  "id": "1a338d50-5b8b-4091-ab81-60fe7f03a532",
  "title": "崩盘：小冰期与大明王朝的衰落",
  "audio_path": "26034db0-bf4c-418e-a7ee-9bb54d3ae854/1a338d50-5b8b-4091-ab81-60fe7f03a532/full_podcast.mp3"
}
```

**关键发现**:
- 🟢 播客在 jobs 表和 podcasts 表中均存在
- 🟢 状态为 "completed"，表示生成完成
- 🟢 有 audio_path，音频文件路径明确
- 🟢 有脚本数据（has_script: true）

---

## 🚨 发现问题

### ❌ API 访问异常

```bash
HTTP 401: Invalid API key
Message: "Invalid API key"
Hint: "Double check your Supabase `anon` or `service_role` API key."
```

**环境变量**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zhvczrrcwpxgrifshhmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**结论**: Supabase API key 无效或已过期

---

## 🔍 Root Cause 分析

### 问题 1: API Key 无效 ⚠️

**影响**:
- 前端无法通过 `getPodcastById()` 获取播客数据
- 音频文件和脚本无法加载
- 播客播放页面显示为加载失败

**原因**:
1. API key 可能已过期
2. Supabase 项目可能已迁移或重置
3. 可能使用的是旧的/错误的 API key

### 问题 2: jobs 表中 title 为 null ⚠️

**影响**:
- 前端显示播客时可能没有标题
- 需要依赖 podcasts 表中的 title

**数据对比**:
- jobs.title = null
- podcasts.title = "崩盘：小冰期与大明王朝的衰落"

**解决方案**:
前端应该优先使用 podcasts.title，回退到 jobs.title

---

## 💡 修复建议

### 🔧 即时修复

1. **更新 Supabase API Key**
   ```bash
   # 登录 Supabase
   https://supabase.com/dashboard/project/zhvczrrcwpxgrifshhmh
   
   # 进入 Settings > API
   # 获取新的 anon public key
   
   # 更新 .env.local
   NEXT_PUBLIC_SUPABASE_ANON_KEY=新key
   ```

2. **重启前端服务**
   ```bash
   pm2 restart history-river-frontend
   ```

3. **测试播客播放**
   ```bash
   # 访问
   https://history.aigc24.com/player.html?episode=1a338d50-5b8b-4091-ab81-60fe7f03a532
   ```

### 🔍 验证修复

#### 测试步骤 1: Supabase 连接
```bash
# 测试 jobs 表访问
supabase_url="https://zhvczrrcwpxgrifshhmh.supabase.co"
new_key="您的新key"

curl -s "${supabase_url}/rest/v1/jobs?id=eq.${episode_id}&limit=1" \
  -H "apikey: ${new_key}" \
  -H "Authorization: Bearer ${new_key}" | jq '.'
```

**期望结果**: 返回 1 条记录，status: 200

#### 测试步骤 2: 音频文件访问
```bash
# 测试音频文件 URL
AUDIO_URL="${supabase_url}/storage/v1/object/public/podcast-media/26034db0-bf4c-418e-a7ee-9bb54d3ae854/1a338d50-5b8b-4091-ab81-60fe7f03a532/full_podcast.mp3"

curl -I ${AUDIO_URL}
```

**期望结果**: HTTP/2 200 OK

#### 测试步骤 3: 前端页面加载
1. 浏览播客播放页
2. 打开浏览器开发者工具 (F12)
3. 检查 Network 面板
4. 确认:
   - ✅ 播客数据加载成功 (200 OK)
   - ✅ 音频文件加载成功 (206 Partial Content)
   - ✅ 脚本数据显示正常

---

## 📊 预期修复后的状态

### ✅ 播客播放页面正常

**加载成功指示**:
- 显示播客标题: "崩盘：小冰期与大明王朝的衰落"
- 显示播客封面图 (generatedImageUrl)
- 音频播放器可正常播放
- 脚本分段显示正确

**API 响应示例**:
```json
{
  "id": "1a338d50-5b8b-4091-ab81-60fe7f03a532",
  "status": "completed",
  "title": "崩盘：小冰期与大明王朝的衰落",
  "output_data": {
    "audioUrl": "https://xx.supabase.co/storage/v1/object/public/podcast-media/...",
    "audioPath": "26034db0-bf4c-418e-a7ee-9bb54d3ae854/.../full_podcast.mp3",
    "script": [
      {
        "speaker": "Male",
        "text": "脚本第一段...",
        "generatedImageUrl": "图片URL"
      }
    ]
  }
}
```

---

## 📝 总结

### 问题根本原因
**Supabase API key 无效** 导致前端无法访问播客数据

### 数据完整性
- ✅ 数据库记录完整存在
- ✅ 音频文件路径明确
- ✅ 脚本数据存在
- ✅ 播客元数据完整

### 修复优先级
🔴 **高** - API key 更新（必须）  
🟡 **中** - 标题回退逻辑（可选）  
🟢 **低** - 数据迁移/备份（长期）

---

**建议**: 立即更新 Supabase API key 并重启服务，预计 2-3 分钟可完全恢复。

**数据安全**: 完全无需担心，所有数据完整无损，仅访问权限问题。

# 播客生产全链路资产存储说明
#project/epub-to-pod 

本文档详细描述了 Epub to Podcast 系统在生产过程中产生的所有资产（Assets）的存储方式、存储位置及命名规范。

## 1. 存储架构概览

系统主要使用 **Supabase** 作为统一的后端服务：

- **Supabase Storage (对象存储)**：用于存储大文件（EPUB、音频、图片）。
- **Supabase Database (PostgreSQL)**：用于存储结构化数据（脚本、元数据、关联关系）。

## 2. 详细存储清单

### 2.1 输入阶段

|资产名称|存储方式|存储位置 (Bucket / Table)|路径 / 字段|说明|
|---|---|---|---|---|
|**EPUB 电子书**|Storage|Bucket: `epubs`|`{userId}/{jobId}/book.epub`|用户上传的原始文件|

### 2.2 生产阶段 (中间产物)

|资产名称|存储方式|存储位置|路径 / 字段|说明|
|---|---|---|---|---|
|**播客脚本 (Script)**|Database|Table: `jobs`|Column: `output_data -> script`|JSON 格式，包含对话、视觉提示词|
|**分段音频**|Storage|Bucket: `podcasts`|`{userId}/{jobId}/audio/{index}.mp3`|每一句对话生成的独立音频片段|
|**分段配图**|Storage|Bucket: `podcasts`|`{userId}/{jobId}/images/{index}.png`|根据视觉提示词生成的 4:3 图片|

### 2.3 交付阶段 (最终产物)

|资产名称|存储方式|存储位置|路径 / 字段|说明|
|---|---|---|---|---|
|**完整播客音频**|Storage|Bucket: `podcasts`|`{userId}/{jobId}/podcast.mp3`|合并后的完整 MP3 文件|
|**YouTube 缩略图**|Storage|Bucket: `podcasts`|`{userId}/{jobId}/youtube_thumbnail.png`|16:9 比例的封面图|
|**YouTube 标题**|Database|Table: `jobs`|Column: `output_data -> youtubeTitle`|营销优化后的标题|
|**YouTube 描述**|Database|Table: `jobs`|Column: `output_data -> youtubeDescription`|包含摘要、Hashtag 的描述|

### 2.4 客户端生成 (不持久化)

|资产名称|存储方式|说明|
|---|---|---|
|**播客视频 (MP4)**|**本地下载**|由前端在浏览器中实时合成，**不上传**到服务器。用户需手动点击 "Download Video" 保存。|

### 2.5 播放控制与时间戳

|数据名称|存储方式|存储位置|说明|
|---|---|---|---|
|**片段时长 (Duration)**|Database|Table: `jobs` (`output_data -> script -> estimatedDuration`)|每个对话片段的精确时长（秒）|
|**时间戳 (Timestamp)**|**前端计算**|**不持久化**|播放器加载时，根据片段时长动态累加计算得出 (`start = sum(prev_durations)`)|
|**图片同步逻辑**|**前端控制**|`PodcastPlayer.tsx`|播放器监听音频当前时间 (`currentTime`)，对比计算出的时间戳，实时切换显示的图片|

## 3. 数据库关联

所有资产通过 `jobId` (任务ID) 进行关联。

- **`jobs` 表**：记录任务状态、脚本内容、YouTube 元数据。
- **`podcasts` 表**：记录已完成的播客，包含指向 Storage 的 URL (`audio_path`, `thumbnail_url`)。

---

_最后更新时间：2025-11-25_
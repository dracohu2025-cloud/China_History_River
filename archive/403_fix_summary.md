# 403错误修复完成

## 🎯 问题
点击event pin时提示"获取历史数据时出错: API error: 403"

## 🔍 根本原因
**Nginx配置冲突**: `/api` location 在 `/api/timeline` 之前，导致请求被代理到错误的Express服务器(4000端口)而不是Django(8000端口)。

## 🔧 修复步骤

### 1. 修复Nginx配置
修改 `/etc/nginx/sites-available/history_river`:

```nginx
# Django Timeline API (必须放在 /api 之前)
location /api/timeline {
    proxy_pass http://127.0.0.1:8000/api/timeline;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Express Backend Proxy (API)
location /api {
    proxy_pass http://127.0.0.1:4000;
    ...
}
```

### 2. 验证修复
```bash
# 测试API端点
curl -X POST https://history.aigc.green/api/timeline/api/event-details/ \
  -H "Content-Type: application/json" \
  -d '{"year":1900,"context":"test"}'

# 响应: 200 OK ✅
```

### 3. 重新构建前端
```bash
cd /home/ubuntu/history_river_2025/history_river_November_2025/history_river
npm run build
```

## ✅ 验证结果

### API测试
- ✅ `/api/timeline/api/event-details/` - POST请求返回200
- ✅ `/api/timeline/api/riverpins/` - GET请求返回200
- ✅ 数据正确返回: `{"text": "...", "cached": false}`

### 前端测试
- ✅ Event pin点击打开DetailModal
- ✅ 显示"正在查阅史籍..."
- ✅ 成功加载历史事件详情
- ✅ 不再显示403错误

## 📝 总结

**问题**: Nginx location顺序导致API路由冲突

**解决**: 调整location顺序，确保 `/api/timeline` 在 `/api` 之前

**状态**: ✅ 生产就绪

**相关文件**:
- `/etc/nginx/sites-available/history_river`
- `/home/ubuntu/history_river_2025/history_river_November_2025/history_river/services/geminiService.ts`
- `/home/ubuntu/history_river_2025/history_river_November_2025/history_river/components/DetailModal.tsx`

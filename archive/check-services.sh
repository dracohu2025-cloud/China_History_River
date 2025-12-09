#!/bin/bash

echo "=== History River 服务状态 ==="
echo ""

echo "端口状态:"
lsof -i :3000,4000,8000 -sTCP:LISTEN || echo "没有服务在运行"

echo ""
echo "进程详情:"
ps aux | grep -E "(vite|express|django|manage.py)" | grep -v grep | grep -v check-services

echo ""
echo "日志文件大小:"
du -h /Users/dracohu/REPO/history_river_November_2025/logs/*.log 2>/dev/null || echo "还没有日志文件"

echo ""
echo "服务访问地址:"
echo "- 前端: http://localhost:3000"
echo "- Express API: http://localhost:4000"
echo "- Django API: http://localhost:8000"

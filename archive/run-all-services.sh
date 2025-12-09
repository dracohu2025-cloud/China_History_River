#!/bin/bash

echo "启动 History River 所有服务..."

# 创建日志目录
mkdir -p /Users/dracohu/REPO/history_river_November_2025/logs

# 启动 Django (端口 8000)
echo "启动 Django API 服务器 (端口 8000)..."
cd /Users/dracohu/REPO/history_river_November_2025/history_river/dj_backend
if lsof -ti:8000 > /dev/null; then
    echo "Django 已经在端口 8000 运行"
else
    nohup python manage.py runserver 0.0.0.0:8000 > /Users/dracohu/REPO/history_river_November_2025/logs/django.log 2>&1 &
    sleep 2
    if lsof -ti:8000 > /dev/null; then
        echo "Django 启动成功"
    else
        echo "Django 启动失败，请检查日志"
    fi
fi

# 启动 Express (端口 4000)
echo "启动 Express AI 服务器 (端口 4000)..."
cd /Users/dracohu/REPO/history_river_November_2025/history_river
if lsof -ti:4000 > /dev/null; then
    echo "Express 已经在端口 4000 运行，杀死旧进程..."
    lsof -ti:4000 | xargs kill -9
    sleep 2
fi
nohup npm run server > /Users/dracohu/REPO/history_river_November_2025/logs/server.log 2>&1 &
sleep 2
if lsof -ti:4000 > /dev/null; then
    echo "Express 启动成功"
else
    echo "Express 启动失败，请检查日志"
fi

# 启动 Vite (端口 3000)
echo "启动 Vite 前端开发服务器 (端口 3000)..."
cd /Users/dracohu/REPO/history_river_November_2025/history_river
if lsof -ti:3000 > /dev/null; then
    echo "Vite 已经在端口 3000 运行，杀死旧进程..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi
nohup npm run dev > /Users/dracohu/REPO/history_river_November_2025/logs/frontend.log 2>&1 &
sleep 3
if lsof -ti:3000 > /dev/null; then
    echo "Vite 启动成功"
else
    echo "Vite 启动失败，请检查日志"
fi

echo ""
echo "=== 服务状态 ==="
sleep 2
lsof -i :3000,4000,8000 -sTCP:LISTEN

echo ""
echo "日志文件位置:"
echo "- 前端: /Users/dracohu/REPO/history_river_November_2025/logs/frontend.log"
echo "- Express: /Users/dracohu/REPO/history_river_November_2025/logs/server.log"
echo "- Django: /Users/dracohu/REPO/history_river_November_2025/logs/django.log"

#!/bin/bash

echo "停止 History River 所有服务..."

# 杀死 Django (端口 8000)
if lsof -ti:8000 > /dev/null; then
    echo "停止 Django..."
    lsof -ti:8000 | xargs kill -9
fi

# 杀死 Express (端口 4000)
if lsof -ti:4000 > /dev/null; then
    echo "停止 Express..."
    lsof -ti:4000 | xargs kill -9
fi

# 杀死 Vite (端口 3000)
if lsof -ti:3000 > /dev/null; then
    echo "停止 Vite..."
    lsof -ti:3000 | xargs kill -9
fi

echo ""
echo "=== 服务状态 ==="
lsof -i :3000,4000,8000 -sTCP:LISTEN || echo "所有服务已停止"

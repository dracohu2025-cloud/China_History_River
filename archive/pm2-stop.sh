#!/bin/bash

# PM2 停止脚本 - History River 项目

set -e

# 颜色定义
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  History River - PM2 停止脚本                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查是否有运行的服务
if ! pm2 list | grep -q "history-river"; then
    echo -e "${YELLOW}⚠️  没有运行的服务${NC}"
    exit 0
fi

echo -e "${BLUE}⏹️  停止所有服务...${NC}"
pm2 stop ecosystem.config.js

echo ""
echo -e "${GREEN}✓ 服务已停止${NC}"
echo ""

# 询问是否删除服务
read -p "是否从 PM2 列表中删除服务? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 delete ecosystem.config.js
    echo -e "${GREEN}✓ 服务已删除${NC}"
else
    echo -e "${YELLOW}服务已停止但仍在 PM2 列表中${NC}"
    echo -e "${YELLOW}可以使用 'pm2 restart ecosystem.config.js' 重启${NC}"
fi

echo ""
echo -e "${BLUE}📊 当前 PM2 状态:${NC}"
pm2 status


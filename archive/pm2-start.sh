#!/bin/bash

# PM2 启动脚本 - History River 项目
# 用于启动所有前后端服务

set -e

# 颜色定义
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  History River - PM2 启动脚本                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}✗ PM2 未安装${NC}"
    echo -e "${YELLOW}请运行: npm install -g pm2${NC}"
    exit 1
fi

echo -e "${GREEN}✓ PM2 已安装${NC}"
echo ""

# 检查是否已有运行的服务
if pm2 list | grep -q "history-river"; then
    echo -e "${YELLOW}⚠️  检测到已运行的服务${NC}"
    read -p "是否重启所有服务? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 重启所有服务...${NC}"
        pm2 restart ecosystem.config.js
    else
        echo -e "${YELLOW}已取消${NC}"
        exit 0
    fi
else
    echo -e "${BLUE}🚀 启动所有服务...${NC}"
    pm2 start ecosystem.config.js
fi

echo ""
echo -e "${GREEN}✓ 服务启动成功！${NC}"
echo ""

# 显示服务状态
echo -e "${BLUE}📊 服务状态:${NC}"
pm2 status

echo ""
echo -e "${BLUE}📋 服务访问地址:${NC}"
echo -e "  ${GREEN}前端 (Vite):${NC}      http://localhost:3000"
echo -e "  ${GREEN}API (Express):${NC}    http://localhost:4000"
echo -e "  ${GREEN}Django API:${NC}       http://localhost:8000"
echo ""

echo -e "${BLUE}💡 常用命令:${NC}"
echo -e "  ${YELLOW}查看状态:${NC}   pm2 status"
echo -e "  ${YELLOW}查看日志:${NC}   pm2 logs"
echo -e "  ${YELLOW}停止服务:${NC}   pm2 stop ecosystem.config.js"
echo -e "  ${YELLOW}重启服务:${NC}   pm2 restart ecosystem.config.js"
echo -e "  ${YELLOW}删除服务:${NC}   pm2 delete ecosystem.config.js"
echo ""

# 询问是否查看日志
read -p "是否查看实时日志? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 logs
fi


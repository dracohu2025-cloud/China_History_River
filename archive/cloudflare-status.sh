#!/bin/bash

# Cloudflare 隧道状态检查脚本

# 颜色定义
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  History River - Cloudflare 隧道状态                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 PM2 服务状态
echo -e "${BLUE}📊 PM2 服务状态:${NC}"
pm2 status
echo ""

# 检查隧道进程
echo -e "${BLUE}🔍 Cloudflare 隧道进程:${NC}"
if pgrep -f "cloudflared tunnel run" > /dev/null; then
    echo -e "${GREEN}✓ 隧道正在运行${NC}"
    echo ""
else
    echo -e "${RED}✗ 隧道未运行${NC}"
    echo -e "${YELLOW}请运行: cloudflared tunnel run history-river-dev${NC}"
    echo ""
    exit 1
fi

# 测试外网访问
echo -e "${BLUE}🌐 外网访问测试:${NC}"
echo ""

# 测试前端
echo -n "  前端 (https://history.aigc24.com): "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://history.aigc24.com)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ $STATUS${NC}"
else
    echo -e "${RED}✗ $STATUS${NC}"
fi

# 测试 API
echo -n "  API (https://history-api.aigc24.com): "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://history-api.aigc24.com)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
    echo -e "${GREEN}✓ $STATUS${NC}"
else
    echo -e "${YELLOW}⚠ $STATUS${NC}"
fi

# 测试 Timeline
echo -n "  Timeline (https://history-timeline.aigc24.com): "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://history-timeline.aigc24.com/api/timeline/)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ $STATUS${NC}"
else
    echo -e "${YELLOW}⚠ $STATUS${NC}"
fi

echo ""
echo -e "${BLUE}📋 访问地址:${NC}"
echo -e "  ${GREEN}前端:${NC}     https://history.aigc24.com"
echo -e "  ${GREEN}API:${NC}      https://history-api.aigc24.com"
echo -e "  ${GREEN}Timeline:${NC} https://history-timeline.aigc24.com"
echo ""

echo -e "${BLUE}💡 管理命令:${NC}"
echo -e "  ${YELLOW}查看 PM2 日志:${NC}      pm2 logs"
echo -e "  ${YELLOW}查看隧道日志:${NC}      tail -f /tmp/cloudflared.log"
echo -e "  ${YELLOW}重启前端:${NC}          pm2 restart history-river-frontend"
echo -e "  ${YELLOW}重启 API:${NC}          pm2 restart history-river-api"
echo -e "  ${YELLOW}重启 Django:${NC}       pm2 restart history-river-django"
echo -e "  ${YELLOW}停止所有服务:${NC}      ./pm2-stop.sh"
echo ""


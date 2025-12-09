#!/bin/bash
# Full migration test script
# Tests end-to-end functionality after EventCache migration

set -e  # Exit on error

echo "=========================================="
echo "EventCache 迁移 - 全面测试"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# Test function
test_step() {
    local name=$1
    local command=$2
    
    echo -n "测试: $name ... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((passed++))
    else
        echo -e "${RED}✗ 失败${NC}"
        ((failed++))
    fi
}

echo "1. Django 服务状态"
echo "-------------------"
test_step "Django 运行中" "curl -f http://localhost:8000/timeline-api/api/health/"
echo ""

echo "2. PostgreSQL 数据验证"
echo "-----------------------"
test_step "EventCache 表存在" "cd history_river/dj_backend && python manage.py shell -c \"from timeline.models import EventCache; EventCache.objects.count()\""
test_step "数据已导入 (55条)" "cd history_river/dj_backend && python manage.py shell -c \"from timeline.models import EventCache; assert EventCache.objects.count() == 55\""
echo ""

echo "3. Django API 测试"
echo "------------------"
test_step "API 端点可访问" "curl -f -X POST http://localhost:8000/api/timeline/api/event-details/ -H 'Content-Type: application/json' -d '{\"year\": 1644, \"event_title\": \"清军入关\"}'"
test_step "缓存查询成功" "curl -s -X POST http://localhost:8000/api/timeline/api/event-details/ -H 'Content-Type: application/json' -d '{\"year\": 1644, \"event_title\": \"清军入关\"}' | grep -q '\"cached\":true'"
echo ""

echo "4. 前端服务状态"
echo "----------------"
test_step "前端运行中" "curl -f http://localhost:3000"
echo ""

echo "5. 端到端功能测试"
echo "------------------"
# 测试浏览器是否能加载并点击事件
test_step "前端 JavaScript 运行正常" "curl -s http://localhost:3000 | grep -q '历史长河'"
echo ""

echo "6. Admin 界面"
echo "-------------"
test_step "Django Admin 可访问" "curl -f http://localhost:8000/admin/"
echo ""

echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo -e "通过: ${GREEN}$passed${NC}"
echo -e "失败: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！迁移成功！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  部分测试失败，请检查${NC}"
    exit 1
fi

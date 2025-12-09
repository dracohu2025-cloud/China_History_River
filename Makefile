.PHONY: help all-dev all-stop

# 颜色定义
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# 配置变量


help:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  History River - Cloudflare 隧道管理 Makefile              ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)隧道管理命令:$(NC)"

	@echo ""
	@echo "$(GREEN)开发命令:$(NC)"
	@echo "  $(YELLOW)make all-dev$(NC)             - 启动所有开发服务"
	@echo "  $(YELLOW)make all-stop$(NC)            - 停止所有开发服务"
	@echo ""
	@echo "$(GREEN)使用示例:$(NC)"
	@echo "  $(YELLOW)make tunnel-start CLOUDFLARE_DOMAIN=example.com$(NC)"
	@echo "  $(YELLOW)make tunnel-test CLOUDFLARE_DOMAIN=example.com$(NC)"
	@echo ""



# ============================================
# 开发命令
# ============================================

all-dev:
	@echo "$(BLUE)🚀 启动所有开发服务...$(NC)"
	@echo "$(YELLOW)前端 (Vite): http://localhost:3000$(NC)"
	@echo "$(YELLOW)Express API: http://localhost:4000$(NC)"
	@echo "$(YELLOW)Django: http://localhost:8000$(NC)"
	@echo ""
	@echo "$(YELLOW)在新的终端窗口中运行以下命令:$(NC)"
	@echo "  cd history_river && npm run dev"
	@echo "  cd history_river && npm run server"
	@echo "  cd history_river/dj_backend && python manage.py runserver"
	@echo ""


all-stop:
	@echo "$(BLUE)⏹️  停止所有开发服务...$(NC)"
	@pkill -f "vite" || echo "$(YELLOW)Vite 未运行$(NC)"
	@pkill -f "node server/index.js" || echo "$(YELLOW)Express 未运行$(NC)"
	@pkill -f "python manage.py runserver" || echo "$(YELLOW)Django 未运行$(NC)"

	@echo "$(GREEN)✓ 所有服务已停止$(NC)"

.DEFAULT_GOAL := help


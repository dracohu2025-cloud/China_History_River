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
	@echo "$(BLUE)🚀 启动开发服务...$(NC)"
	@echo "$(YELLOW)前端 (Vite): http://localhost:3000$(NC)"
	@echo "$(YELLOW)架构: 纯 Serverless (Supabase + Vercel Functions)$(NC)"
	@echo ""
	@echo "$(YELLOW)在终端窗口中运行以下命令:$(NC)"
	@echo "  cd history_river && npm run dev"
	@echo ""
	@echo "$(GREEN)✓ 无需 Django/Express 后端$(NC)"
	@echo "$(GREEN)✓ Supabase 提供数据 API$(NC)"
	@echo "$(GREEN)✓ Vercel 提供 AI 无服务器函数$(NC)"


all-stop:
	@echo "$(BLUE)⏹️  停止开发服务...$(NC)"
	@pkill -f "vite" || echo "$(YELLOW)Vite 未运行$(NC)"

	@echo "$(GREEN)✓ 服务已停止$(NC)"
	@echo "$(YELLOW)注: Supabase/Vercel 为远程服务，无需停止$(NC)"

.DEFAULT_GOAL := help


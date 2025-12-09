#!/bin/bash

# Cloudflare 隧道管理脚本 - History River 项目
# 用法: ./cloudflare-tunnel.sh [start|stop|status|logs|config]

set -e

TUNNEL_NAME="history-river-dev"
CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"
CREDENTIALS_FILE="$CONFIG_DIR/${TUNNEL_NAME}.json"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 检查 cloudflared 是否安装
check_cloudflared() {
    if ! command -v cloudflared &> /dev/null; then
        print_error "cloudflared 未安装"
        print_info "请运行: brew install cloudflare/cloudflare/cloudflared"
        exit 1
    fi
    print_success "cloudflared 已安装"
}

# 检查配置文件
check_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "配置文件不存在: $CONFIG_FILE"
        print_info "请先运行: cloudflared tunnel login"
        exit 1
    fi
    print_success "配置文件存在"
}

# 检查凭证文件
check_credentials() {
    if [ ! -f "$CREDENTIALS_FILE" ]; then
        print_error "凭证文件不存在: $CREDENTIALS_FILE"
        print_info "请先运行: cloudflared tunnel create $TUNNEL_NAME"
        exit 1
    fi
    print_success "凭证文件存在"
}

# 启动隧道
start_tunnel() {
    print_info "启动 Cloudflare 隧道: $TUNNEL_NAME"
    check_cloudflared
    check_config
    check_credentials
    
    print_info "隧道配置:"
    print_info "  - 前端: https://frontend.yourdomain.com (localhost:3000)"
    print_info "  - API: https://api.yourdomain.com (localhost:4000)"
    print_info "  - Timeline: https://timeline.yourdomain.com (localhost:8000)"
    
    cloudflared tunnel run $TUNNEL_NAME
}

# 停止隧道
stop_tunnel() {
    print_info "停止 Cloudflare 隧道..."
    pkill -f "cloudflared tunnel run" || print_warning "隧道进程未运行"
    print_success "隧道已停止"
}

# 查看隧道状态
status_tunnel() {
    print_info "检查隧道状态..."
    cloudflared tunnel status $TUNNEL_NAME
}

# 查看隧道日志
logs_tunnel() {
    print_info "显示隧道日志 (按 Ctrl+C 退出)..."
    cloudflared tunnel run $TUNNEL_NAME --loglevel debug
}

# 显示配置
show_config() {
    print_info "当前隧道配置:"
    echo ""
    cat "$CONFIG_FILE"
    echo ""
    print_info "隧道 ID:"
    cat "$CREDENTIALS_FILE" | grep -o '"id":"[^"]*' | cut -d'"' -f4
}

# 列出所有隧道
list_tunnels() {
    print_info "已创建的隧道列表:"
    cloudflared tunnel list
}

# 测试连接
test_connection() {
    print_info "测试隧道连接..."
    
    # 这里需要用户提供实际的域名
    DOMAIN="${1:-yourdomain.com}"
    
    print_info "测试前端连接: https://frontend.$DOMAIN"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "https://frontend.$DOMAIN" || print_warning "前端连接失败"
    
    print_info "测试 API 连接: https://api.$DOMAIN"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "https://api.$DOMAIN" || print_warning "API 连接失败"
    
    print_info "测试 Timeline 连接: https://timeline.$DOMAIN"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "https://timeline.$DOMAIN" || print_warning "Timeline 连接失败"
}

# 显示帮助
show_help() {
    cat << EOF
Cloudflare 隧道管理脚本 - History River 项目

用法: $0 [命令] [选项]

命令:
  start       启动隧道 (前台运行)
  stop        停止隧道
  status      查看隧道状态
  logs        显示隧道日志 (调试模式)
  config      显示隧道配置
  list        列出所有隧道
  test        测试隧道连接 (需要提供域名)
  help        显示此帮助信息

示例:
  $0 start                    # 启动隧道
  $0 status                   # 查看状态
  $0 test example.com         # 测试连接
  $0 logs                     # 显示调试日志

隧道配置:
  - 前端: https://frontend.yourdomain.com (localhost:3000)
  - API: https://api.yourdomain.com (localhost:4000)
  - Timeline: https://timeline.yourdomain.com (localhost:8000)

EOF
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_tunnel
            ;;
        stop)
            stop_tunnel
            ;;
        status)
            status_tunnel
            ;;
        logs)
            logs_tunnel
            ;;
        config)
            show_config
            ;;
        list)
            list_tunnels
            ;;
        test)
            test_connection "$2"
            ;;
        help)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"


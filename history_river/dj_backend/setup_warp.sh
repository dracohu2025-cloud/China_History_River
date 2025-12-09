#!/bin/bash
# Cloudflare WARP 安装脚本
# 用于在IPv4网络上访问IPv6资源

set -e

echo "=========================================="
echo "Cloudflare WARP 安装脚本"
echo "用于在IPv4网络上访问IPv6资源"
echo "=========================================="
echo ""

# 检查系统版本
echo "📋 检查系统信息..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "   OS: $ID $VERSION"
else
    echo "   ⚠️  无法检测操作系统"
fi

# 检查是否已安装WARP
echo ""
echo "🔍 检查WARP安装状态..."
if command -v warp-cli &> /dev/null; then
    WARP_VERSION=$(warp-cli --version 2>&1)
    echo "   ✅ WARP已安装: $WARP_VERSION"
    
    # 检查WARP状态
    echo ""
    echo "📊 检查WARP连接状态..."
    warp-cli status
else
    echo "   ⚠️  WARP未安装"
fi

echo ""
echo "=========================================="
echo "安装步骤:"
echo "=========================================="
echo ""
echo "1. 添加Cloudflare包仓库"
echo "   curl https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg"
echo ""
echo "2. 添加仓库源"
echo "   echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ focal main' | sudo tee /etc/apt/sources.list.d/cloudflare-client.list"
echo ""
echo "3. 更新包列表"
echo "   sudo apt update"
echo ""
echo "4. 安装WARP"
echo "   sudo apt install cloudflare-warp"
echo ""
echo "5. 注册WARP"
echo "   warp-cli register"
echo ""
echo "6. 连接到WARP"
echo "   warp-cli connect"
echo ""
echo "7. 验证连接"
echo "   warp-cli status"
echo "   curl -6 https://www.cloudflare.com/cdn-cgi/trace"
echo ""

echo "=========================================="
echo "卸载命令:"
echo "=========================================="
echo "sudo apt remove cloudflare-warp"
echo "sudo rm /etc/apt/sources.list.d/cloudflare-client.list"
echo "sudo rm /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg"
echo ""

echo "=========================================="
echo "故障排查:"
echo "=========================================="
echo "warp-cli status              # 查看状态"
echo "warp-cli connect             # 手动连接"
echo "warp-cli disconnect          # 断开连接"
echo "warp-cli logs                # 查看日志"
echo "sudo systemctl status warp-svc  # 查看服务状态"
echo ""

echo "=========================================="
echo "注意: 使用WARP可能会影响其他服务"
echo "如果出现问题，可以运行:"
echo "warp-cli disconnect"
echo "=========================================="

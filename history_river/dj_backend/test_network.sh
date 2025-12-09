#!/bin/bash
# 测试Supabase数据库连接性

echo "=== 测试Supabase数据库连接 ==="

# 测试DNS解析
echo "1. 测试DNS解析..."
getent hosts db.zhvczrrcwpxgrifshhmh.supabase.co || echo "DNS解析失败"

# 测试ping (可能icmp被阻止)
echo "2. 测试ping..."
ping -c 3 db.zhvczrrcwpxgrifshhmh.supabase.co || echo "Ping失败"

# 测试IPv6连接
echo "3. 测试IPv6连接..."
python3 << 'EOF'
import socket
import sys

try:
    # 尝试IPv6
    addr_info = socket.getaddrinfo(
        'db.zhvczrrcwpxgrifshhmh.supabase.co', 
        5432, 
        socket.AF_INET6, 
        socket.SOCK_STREAM
    )
    print(f"IPv6地址: {addr_info[0][4][0]}")
    
    # 尝试连接
    sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    sock.settimeout(5)
    result = sock.connect_ex((addr_info[0][4][0], 5432))
    
    if result == 0:
        print("IPv6连接: 成功")
    else:
        print(f"IPv6连接: 端口不可达 (错误码: {result})")
    sock.close()
except Exception as e:
    print(f"IPv6连接: 失败 - {e}")

# 尝试IPv4 fallback
try:
    addr_info = socket.getaddrinfo(
        'db.zhvczrrcwpxgrifshhmh.supabase.co', 
        5432, 
        socket.AF_INET, 
        socket.SOCK_STREAM
    )
    print(f"IPv4地址: {addr_info[0][4][0]}")
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    result = sock.connect_ex((addr_info[0][4][0], 5432))
    
    if result == 0:
        print("IPv4连接: 成功")
    else:
        print(f"IPv4连接: 端口不可达 (错误码: {result})")
    sock.close()
except Exception as e:
    print(f"IPv4连接: 失败 - {e}")
EOF

# 测试通过psql连接（如果存在）
if command -v psql &> /dev/null; then
    echo "4. 测试psql连接..."
    PGPASSWORD="Dracohu2019." psql -h db.zhvczrrcwpxgrifshhmh.supabase.co -p 5432 -U postgres -d postgres -c "SELECT 1;" -t || echo "psql连接失败"
else
    echo "4. psql未安装，跳过直接连接测试"
fi

echo "=== 测试完成 ==="
#!/bin/bash
cd "$(dirname "$0")"

echo "======================================"
echo "   备考复习系统 - 本地启动"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装"
    read -p "按回车键退出..."
    exit 1
fi

# 获取本机 IP
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "🚀 正在启动服务器..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💻 电脑访问：http://localhost:3000"
if [ -n "$IP" ]; then
    echo "  📱 手机访问：http://$IP:3000"
fi
echo ""
echo "  手机需要和电脑连同一个 WiFi"
echo "  密码：023022"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev

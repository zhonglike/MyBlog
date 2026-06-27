@echo off
title MyBlog Server - 外网访问 (Cloudflare Tunnel)
cd /d E:\myblogoc\myblog
echo ====================================
echo   MyBlog 博客服务器 + 外网隧道
echo ====================================
echo.
echo   启动后等待 Cloudflare 分配临时域名...
echo   请勿关闭此窗口
echo.
node start-tunnel.js
pause
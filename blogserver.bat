@echo off
title MyBlog Server - 内网访问
cd /d E:\myblogoc\myblog
echo ====================================
echo   MyBlog 博客服务器 (内网)
echo ====================================
echo.
echo   本机访问: http://localhost:3000
echo   局域网:   http://192.168.1.39:3000
echo.
node server.js
pause
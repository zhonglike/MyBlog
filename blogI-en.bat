@echo off
title MyBlog Server - External Access (Cloudflare Tunnel)
cd /d E:\myblogoc\myblog
echo ====================================
echo   MyBlog Blog Server + External Tunnel
echo ====================================
echo.
echo   Waiting for Cloudflare to assign a temporary domain...
echo   Do NOT close this window
echo.
node start-tunnel.js
pause

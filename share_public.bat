@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo    考亭理学书院 · 临时公网链接生成向导 (Cloudflare Tunnel)
echo ======================================================
echo.
echo 说明：
echo 运行本脚本可为您生成一个临时的公网 HTTPS 链接，
echo 哪怕异地的朋友不在同一个 WiFi，用手机点开也能直接和朱子对话！
echo （注意：运行时请保持 start.bat 服务处于开启状态）
echo.

if not exist "cloudflared.exe" (
    echo [*] 正在快速下载轻量穿透工具 cloudflared.exe (免登录、免注册、零费用)...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
)

if not exist "cloudflared.exe" (
    echo [!] 下载遇到网络波动，您也可以通过免费工具 cpolar (https://www.cpolar.com) 一键映射 8000 端口。
    pause
    exit /b
)

echo [+] 穿透工具就绪，正在生成临时公网安全链接...
echo.
echo ======================================================================
echo 请在下方寻找形如 "https://xxxx.trycloudflare.com" 的链接，
echo 直接复制发给微信好友或异地朋友，手机点开即可使用！
echo （关闭本窗口即停止外部访问）
echo ======================================================================
echo.

cloudflared.exe tunnel --url http://127.0.0.1:8000
pause


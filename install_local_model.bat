@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================================
echo    考亭理学书院 · 本地大模型一键配置向导
echo ======================================================
echo.
echo 说明：如果您的电脑配备了独立显卡并希望使用本地大模型：
echo.
echo [1/2] 正在检查 Ollama 环境...
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] 未检测到 Ollama，正在为您打开官方下载页面：https://ollama.com/download
    start https://ollama.com/download
    echo 安装完毕后，请再次运行本脚本即可自动拉取模型。
    pause
    exit /b
)
echo [+] 已检测到 Ollama 命令！
echo.
echo [2/2] 正在拉取 qwen2.5:1.5b 智能体模型 (约 986MB，高速下载中)...
ollama pull qwen2.5:1.5b
echo.
echo ======================================================
echo [+] 大模型下载安装完毕！
echo 现在您可以直接双击 start.bat 体验完整的 GPU 本地智能体！
echo ======================================================
pause


@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo    考亭理学书院 · 24 小时云端永久上线部署助手
echo ======================================================
echo.

git --version >nul 2>nul
if %errorlevel% equ 0 goto GIT_READY

echo [!] 未检测到 Git 工具，请先安装 Git 客户端
pause
exit /b

:GIT_READY
echo [+] Git 工具已就绪。
if not exist ".git" git init -b main
if not exist ".git" git branch -m main

git add .
git commit -m "Deploy Zhu Xi Cultural Agent"

echo.
echo ======================================================
echo 请在下方粘贴您的 Hugging Face 空间或 GitHub 仓库地址：
echo 示例：https://huggingface.co/spaces/你的名字/zhuzi
echo ======================================================
set /p REPO_URL=请输入仓库链接: 

if "%REPO_URL%"=="" goto NO_URL

git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%
echo.
echo [*] 正在将代码推送到云端空间...
git push -u origin main --force

echo.
echo ======================================================
echo [+] 代码已成功推送至云端！
echo 请前往您的云端空间页面查看构建进度，几分钟后即可通过
echo 专属网址在任何设备上 24 小时不间断访问！
echo ======================================================
pause
exit /b

:NO_URL
echo [!] 未输入仓库地址，部署已取消。
pause
exit /b

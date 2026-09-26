@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================
echo    考亭理学书院 · 朱子文化特色智能体 (一键运行)
echo ======================================================
echo.

:: 1. 自动寻找可用 Python 命令
set PY_CMD=
py -3.13 --version >nul 2>nul
if %errorlevel% equ 0 (
    set PY_CMD=py -3.13
) else (
    py --version >nul 2>nul
    if %errorlevel% equ 0 (
        set PY_CMD=py
    ) else (
        python --version >nul 2>nul
        if %errorlevel% equ 0 (
            set PY_CMD=python
        )
    )
)

if "%PY_CMD%"=="" (
    echo [!] 未检测到 Python 环境！
    echo 请先安装 Python 3.9+ 运行环境：https://www.python.org/downloads/
    echo （安装时请务必勾选 "Add python.exe to PATH"）
    pause
    exit /b
)

:: 2. 自动检查依赖，缺失则自动补全安装
echo [*] 正在检查运行依赖...
%PY_CMD% -c "import fastapi, uvicorn" >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] 首次启动，正在为您快速补全必要依赖 (通常只需十几秒)...
    %PY_CMD% -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --quiet
)

:: 3. 自动在浏览器中打开主界面
echo [+] 正在启动考亭书院服务，浏览器即将自动打开...
start "" http://127.0.0.1:8000/

:: 4. 启动服务主程序
%PY_CMD% run.py
if %errorlevel% neq 0 (
    echo.
    echo 服务已退出。
    pause
)

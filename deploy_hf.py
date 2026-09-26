"""
考亭理学书院 · 朱子文化特色智能体
一键直通 Hugging Face Spaces 免费云端全自动部署脚本
"""

import os
import sys
import argparse

def deploy(token: str = None, repo_name: str = "zhuzi-agent"):
    try:
        from huggingface_hub import HfApi, create_repo, upload_folder
    except ImportError:
        print("[错误] 请先安装 huggingface_hub: pip install huggingface_hub")
        return

    if not token:
        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")

    if not token:
        print("=" * 60)
        print("  【需要 Hugging Face 访问令牌 Access Token】")
        print("  1. 打开免费获取页面: https://huggingface.co/settings/tokens")
        print("  2. 点击 'Create new token'，选择 'write' 权限")
        print("  3. 将生成的 hf_ 开头的令牌复制并传入即可")
        print("=" * 60)
        token = input("请输入您的 Hugging Face Write Token: ").strip()

    if not token:
        print("[中断] 未输入有效令牌，部署终止。")
        return

    api = HfApi(token=token)
    try:
        user_info = api.whoami()
        username = user_info.get("name")
        print(f"[+] 成功连接 Hugging Face 账号: {username}")
    except Exception as e:
        print(f"[错误] 令牌验证失败: {e}")
        return

    space_id = f"{username}/{repo_name}"
    print(f"[+] 正在云端创建专属 Space 空间: {space_id} ...")
    try:
        create_repo(
            repo_id=space_id,
            repo_type="space",
            space_sdk="docker",
            exist_ok=True,
            token=token
        )
        print(f"[+] Space 空间就绪: https://huggingface.co/spaces/{space_id}")
    except Exception as e:
        print(f"[提示] 创建空间提示: {e}")

    # 读取本地智谱 API Key
    zhipu_key = os.environ.get("API_KEY", "").strip()
    if not zhipu_key and os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("API_KEY="):
                    zhipu_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    if zhipu_key:
        print(f"[+] 正在配置云端环境变量 API_KEY ...")
        try:
            api.add_space_secret(repo_id=space_id, key="API_KEY", value=zhipu_key)
            print("[+] 云端 API_KEY 配置成功！")
        except Exception as e:
            print(f"[提示] 配置 Secret 提示: {e}")

    # 上传工程文件
    print("[+] 正在同步上传所有代码、典籍库与静态资源到云端...")
    ignore_patterns = [
        ".git/*",
        ".git",
        "*.pyc",
        "__pycache__/*",
        "__pycache__",
        "cloudflared.exe",
        "*.exe",
        ".env*",
        "scratch/*",
        ".agent/*",
        ".vscode/*"
    ]
    try:
        upload_folder(
            folder_path=".",
            repo_id=space_id,
            repo_type="space",
            ignore_patterns=ignore_patterns,
            token=token,
            commit_message="Deploy Zhu Xi Cultural Agent"
        )
        print("=" * 60)
        print("  🎉 部署成功！项目已全部交付云端托管！")
        print(f"  空间管理地址: https://huggingface.co/spaces/{space_id}")
        print(f"  全网直接访问: https://{username}-{repo_name}.hf.space")
        print("  此网站全年 365 天云端运行，您的本地电脑现在可以随时关机！")
        print("=" * 60)
    except Exception as e:
        print(f"[错误] 上传失败: {e}")

if __name__ == "__main__":
    t = sys.argv[1] if len(sys.argv) > 1 else None
    deploy(token=t)

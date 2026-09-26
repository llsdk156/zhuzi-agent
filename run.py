"""
朱子文化特色智能体一键启动脚本
"""

import os
import sys
import socket

# 确保项目根目录在 sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn
from rag.rag_service import rag_service


def get_lan_ips():
    ips = []
    try:
        for item in socket.getaddrinfo(socket.gethostname(), None):
            ip = item[4][0]
            if ":" not in ip and not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass
    return ips


def print_banner(host: str, port: int):
    print("=" * 66)
    print("           考亭理学书院 · 朱子文化特色智能体")
    print("     “字求其训，句索其旨 · 即物穷理，笃行致知”")
    print("=" * 66)
    stats = rag_service.get_stats()
    print(f"[*] 传世经典电子书: {stats.get('ebooks_download_count', 0)} 部")
    print(f"[*] 武夷特色文献:   {stats.get('base_corpus_count', 0)} 部")
    print(f"[*] 已切块理学知识切片: {stats.get('total_chunks', 0)} 个")

    from core.agent_engine import zhuzi_agent
    if zhuzi_agent.api_key:
        print(f"[*] 智能驱动引擎: 智谱清言 GLM 免费大模型 文本:{zhuzi_agent.llm_model} 识图:{zhuzi_agent.vision_model}")
    else:
        print("[*] 智能驱动引擎: 考亭书院·原生自适应认知引擎 零依赖 全离线 人人可用")

    print("-" * 66)
    print(f"[+] 本机电脑访问地址:        http://127.0.0.1:{port}/")
    lan_ips = get_lan_ips()
    for lan_ip in lan_ips:
        if lan_ip.startswith("172.") or lan_ip.startswith("192.168.") or lan_ip.startswith("10.") or lan_ip.startswith("26."):
            print(f"[+] 局域网/手机/他人访问地址: http://{lan_ip}:{port}/")
    print(f"[+] API 标准问对接口:        http://127.0.0.1:{port}/api/chat")
    print(f"[+] OpenAI 兼容规范接口:     http://127.0.0.1:{port}/v1/chat/completions")
    print("=" * 66)


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    print_banner(host, port)
    uvicorn.run("app:app", host=host, port=port, reload=False)

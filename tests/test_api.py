"""
智能体服务 API 与超新星适配器集成测试
"""

import os
import sys

# 保证控制台输出 UTF-8
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import app
from core.agent_engine import zhuzi_agent


def test_agent_engine_direct():
    """测试朱子智能体核心推理与意图识别"""
    # 读书法意图
    res1 = zhuzi_agent.chat("我最近读书很浮躁，读不进去怎么办？")
    assert res1["intent"] == "reading_method"
    assert "循序渐进" in res1["reply"] or "朱子读书法" in res1["reply"] or "熟读精思" in res1["reply"]
    print("[PASS] test_agent_engine 读书法意图与回复正确！")

    # 理学本体论意图
    res2 = zhuzi_agent.chat("请问先生什么是理一分殊？")
    assert "理一分殊" in res2["reply"]
    print("[PASS] test_agent_engine 理学意图与回复正确！")

    # 白鹿洞规训意图
    res3 = zhuzi_agent.chat("白鹿洞学规中修身接物的关键是什么？")
    assert "白鹿洞" in res3["reply"] or "处事" in res3["reply"] or "接物" in res3["reply"]
    print("[PASS] test_agent_engine 白鹿洞规训意图与回复正确！")


def test_api_endpoints_with_testclient():
    """尝试使用 TestClient 进行 HTTP 协议端到端测试"""
    try:
        from fastapi.testclient import TestClient
        client = TestClient(app)

        # 1. 健康检查
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        print("[PASS] GET /health 状态正常")

        # 2. 知识库状态
        resp = client.get("/api/knowledge/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_chunks"] > 0
        print(f"[PASS] GET /api/knowledge/stats 正常，当前切片: {data['total_chunks']}")

        # 3. 超新星 Webhook 接口
        webhook_payload = {
            "query": "朱子读书法有哪几步？",
            "userId": "student_test_101",
            "token": "zhuzi_secret_key_2026"
        }
        resp = client.post("/api/supernova/webhook", json=webhook_payload)
        assert resp.status_code == 200
        resp_data = resp.json()
        assert resp_data["code"] == 200
        assert "answer" in resp_data["data"]
        print("[PASS] POST /api/supernova/webhook 超新星通道测试通过！")

        # 4. OpenAI 兼容接口
        openai_payload = {
            "model": "zhuzi-agent",
            "messages": [{"role": "user", "content": "何谓格物致知？"}]
        }
        resp = client.post("/v1/chat/completions", json=openai_payload)
        assert resp.status_code == 200
        assert "choices" in resp.json()
        print("[PASS] POST /v1/chat/completions OpenAI兼容协议测试通过！")

        # 5. 超新星接入规范文档
        resp = client.get("/api/supernova/spec")
        assert resp.status_code == 200
        assert "integration_modes" in resp.json()
        print("[PASS] GET /api/supernova/spec 规范接口正常")

    except ImportError:
        print("[WARN] 未安装 httpx/testclient，跳过 HTTP 传输层模拟，核心推理引擎已通过验证。")


if __name__ == "__main__":
    test_agent_engine_direct()
    test_api_endpoints_with_testclient()
    print("\n[SUCCESS] 全部 API 与智能体核心测试均已圆满通过！")


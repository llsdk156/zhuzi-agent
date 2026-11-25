"""
朱子智能体核心引擎、对话安全、OPAC、考校测验与 API 全链路集成测试
"""

import json
import os
import sys

# 保证控制台输出 UTF-8
if hasattr(sys.stdout, "encoding") and sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient

from app import app
from core.agent_engine import (
    StreamingSanitizer,
    clean_system_notes,
    is_grounded_query,
    sanitize_zhuxi_first_person,
    session_manager,
    zhuzi_agent,
)
from core.opac_service import opac_service


def test_sanitizer_and_grounding():
    """验证流式净化器不破坏书名号/史实括号/他者人称，以及领域护栏精准度"""
    # 1. 静态清洗保护《朱子语类》与史实年代括号
    s1 = sanitize_zhuxi_first_person("宋·朱熹 著《朱子语类》（1130-1200），朱熹认为孔子重视仁义，他的思想惠泽后世。")
    assert "《朱子语类》" in s1, f"书名被误改: {s1}"
    assert "宋·朱熹 著" in s1, f"署名被误改: {s1}"
    assert "老夫以为" in s1, f"朱熹认为未转第一人称: {s1}"
    assert "他的思想" in s1, f"孔子的他称被误改: {s1}"

    s2 = clean_system_notes("《大学章句》（中华书局点校本）如是说。（注：以上由系统自动生成）")
    assert "（中华书局点校本）" in s2, f"正常版本括号被误删: {s2}"
    assert "系统自动生成" not in s2, f"系统提示注记未被清除: {s2}"

    # 2. 流式跨 chunk 书名号保护
    streamer = StreamingSanitizer()
    chunks = ["据《朱", "子语类》所载，朱", "熹认为孔子乃万世师表，他", "的教化至今犹存。"]
    out = "".join(streamer.feed(c) for c in chunks) + streamer.flush()
    assert "《朱子语类》" in out, f"流式跨块损坏书名: {out}"
    assert "老夫以为" in out, f"流式未转换第一人称: {out}"
    assert "他的教化" in out, f"流式误改孔子第三人称: {out}"

    # 3. 领域护栏正负样本
    assert is_grounded_query("戴震是如何批评朱子理气观的？", []) is True
    assert is_grounded_query("当代短视频如何传播朱子学文化？", []) is True
    assert is_grounded_query("请帮我用Python写一个快速排序算法", []) is False
    assert is_grounded_query("帮我写一篇黑洞科幻小说", []) is False
    assert is_grounded_query("红烧肉怎么做好吃？", []) is False
    print("[PASS] test_sanitizer_and_grounding 净化与护栏测试通过！")


def test_agent_edge_cases():
    """验证索书号不被算术劫持、情绪表达不被当姓名、多轮会话交替记录"""
    # 1. 索书号包含 '/' 不得误触发小学算术题
    sid_callno = "test_callno_session"
    session_manager.sessions.pop(sid_callno, None)
    res_callno = zhuzi_agent.chat("图书馆索书号 B244.7/12 对应的是哪部馆藏？", session_id=sid_callno)
    assert "20.39" not in res_callno["reply"], f"索书号被误当除法算式: {res_callno['reply']}"

    # 2. “学生最近很浮躁”不得被误识别为学生姓名“最近很浮”
    sid_name = "test_name_session"
    session_manager.sessions.pop(sid_name, None)
    res_name = zhuzi_agent.chat("学生最近很浮躁，读书总是静不下心怎么办？", session_id=sid_name)
    assert res_name["intent"] == "reading_method"
    sess = session_manager.get_or_create(sid_name)
    assert sess.get("user_name") in (None, ""), f"误解析姓名: {sess}"

    # 3. 服务端会话历史必须完整交替存储 user + assistant
    hist = sess.get("history", [])
    assert len(hist) == 2 and hist[0]["role"] == "user" and hist[1]["role"] == "assistant", f"会话历史异常: {hist}"
    print("[PASS] test_agent_edge_cases 边界与会话管理测试通过！")


def test_opac_data_integrity():
    """验证损坏的武夷专著数据已修复，且未知书目诚实返回未查得馆藏"""
    for key in ("wuyi_haiwai", "wuyi_shici", "wuyi_fujian", "wuyi_century"):
        rec = opac_service.get_live_book_status(key, force=False)
        assert rec.get("found") is True, f"{key} 应命中馆藏"
        assert rec.get("totalCopies", 0) < 100, f"{key} 馆藏复本数仍异常: {rec}"

    missing = opac_service.get_live_book_status("一本完全不存在的虚构书目XYZ999", force=False)
    assert missing.get("found") is False
    assert missing.get("status") == "未查得馆藏"
    assert missing.get("isBorrowable") is False
    print("[PASS] test_opac_data_integrity OPAC 馆藏数据完整性通过！")


def test_api_endpoints_comprehensive():
    """HTTP 全接口回归测试（健康、RAG、安全、超新星、OpenAI流式、考校、尺牍、TTS）"""
    client = TestClient(app)

    # 1. 健康检查 & 知识库统计
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"

    r = client.get("/api/knowledge/stats")
    assert r.status_code == 200
    stats = r.json()
    assert stats["total_chunks"] > 0 and len(stats.get("indexed_sources", [])) >= 6

    # 2. 路径穿越安全防护
    r_trav = client.get("/api/book/content", params={"filename": "../../.env"})
    assert r_trav.status_code == 400, f"路径穿越应返回 400，实际 {r_trav.status_code}"

    # 3. 超新星鉴权与脱敏
    r_unauth = client.post("/api/supernova/webhook", json={"query": "何谓格物致知", "userId": "u1"})
    assert r_unauth.status_code == 403, f"无 token 应拒绝 403，实际 {r_unauth.status_code}"

    r_spec = client.get("/api/supernova/spec")
    assert r_spec.status_code == 200
    spec_text = json.dumps(r_spec.json(), ensure_ascii=False)
    assert "zhuzi_secret_key_2026" not in spec_text, "/api/supernova/spec 泄露了明文密钥！"

    token = os.getenv("SUPERNOVA_API_TOKEN") or "zhuzi_secret_key_2026"
    r_ok = client.post(
        "/api/supernova/webhook",
        json={"query": "朱子读书法有哪几条？", "userId": "student_test_101", "token": token},
    )
    assert r_ok.status_code == 200
    ok_data = r_ok.json()
    assert ok_data["code"] == 200 and ok_data["data"]["answer"] and ok_data["data"]["content"]

    # 4. OpenAI 兼容协议（同步 + SSE 流式）
    r_oai = client.post(
        "/v1/chat/completions",
        json={"model": "zhuzi-agent", "messages": [{"role": "user", "content": "何谓理一分殊？"}]},
    )
    assert r_oai.status_code == 200 and r_oai.json()["choices"][0]["message"]["content"]

    r_oai_stream = client.post(
        "/v1/chat/completions",
        json={"model": "zhuzi-agent", "stream": True, "messages": [{"role": "user", "content": "你好"}]},
    )
    assert r_oai_stream.status_code == 200
    body_stream = r_oai_stream.text
    assert '"role": "assistant"' in body_stream and "data: [DONE]" in body_stream

    # 5. 流式对话接口（SSE 头与结束事件）+ 停止接口
    r_chat_stream = client.post(
        "/api/chat/stream",
        json={"query": "你好，请问先生格物致知何意？", "session_id": "test_stream_01", "mode": "qa"},
    )
    assert r_chat_stream.status_code == 200
    assert r_chat_stream.headers.get("x-accel-buffering") == "no"
    assert '"type": "done"' in r_chat_stream.text

    r_stop = client.post("/api/chat/stop", json={"session_id": "test_stream_01"})
    assert r_stop.status_code == 200

    # 6. 研学考校测验（选项打乱映射 + 缺答按全卷计分）
    r_quiz = client.get("/api/quiz/questions", params={"category": "all", "count": 5})
    assert r_quiz.status_code == 200
    q_list = r_quiz.json()["questions"]
    assert len(q_list) == 5
    assert all("option_indices" in q and len(q["option_indices"]) == len(q["options"]) for q in q_list)
    assert all("《《" not in (q.get("question", "") + q.get("source", "")) for q in q_list)

    q_ids = [q["id"] for q in q_list]
    r_sub = client.post(
        "/api/quiz/submit",
        json={"answers": {str(q_ids[0]): 0}, "question_ids": q_ids},
    )
    assert r_sub.status_code == 200
    sub_data = r_sub.json()
    assert sub_data["total_count"] == 5 and sub_data["score"] <= 20, f"缺答 4 题计分异常: {sub_data}"

    # 7. 考亭尺牍：普通“喜欢读书”不得误判为情书模式
    from app import _ROMANTIC_RE
    assert not _ROMANTIC_RE.search("我非常喜欢研读朱子语类与四书章句")
    assert _ROMANTIC_RE.search("我喜欢了一个女孩想表白")
    r_letter = client.post(
        "/api/letter/submit",
        json={"content": "我非常喜欢研读朱子语类与四书章句，请先生赐尺牍勉励进学。"},
    )
    assert r_letter.status_code == 200
    letter_data = r_letter.json()
    assert letter_data.get("reply") and "妆次" not in letter_data.get("reply", ""), f"普通读书请求被误判为情笺: {letter_data}"

    # 8. TTS 空文本返回 400
    r_tts_empty = client.post("/api/tts", json={"text": "   "})
    assert r_tts_empty.status_code == 400

    print("[PASS] test_api_endpoints_comprehensive 全部 HTTP 接口测试通过！")


if __name__ == "__main__":
    test_sanitizer_and_grounding()
    test_agent_edge_cases()
    test_opac_data_integrity()
    test_api_endpoints_comprehensive()
    print("\n[SUCCESS] 全部 API 与智能体核心测试均已圆满通过！")

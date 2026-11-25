"""
考亭研撰 · 朱子文化论文写作系统全流程单元测试
覆盖：领域校验、智能拟题、动态特藏引文与 GB/T 7714、大纲生成、流式撰润、五维审稿、互动答辩、草稿导入、Word(.docx)/Markdown(.md)导出与零新增表情图标验证
"""

import io
import os
import sys
import zipfile

if hasattr(sys.stdout, "encoding") and sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import docx
from fastapi.testclient import TestClient

from app import app
from core import thesis_service


def _assert_no_emoji(text: str, label: str = ""):
    assert not thesis_service._EMOJI_RE.search(text or ""), f"[{label}] 检测到不应出现的 emoji 图标: {text[:200]}"


def test_domain_guard_and_topics():
    client = TestClient(app)

    # 1. 非朱子文化离题拦截
    r_off = client.post("/api/thesis/topics", json={"keyword": "Python神经网络股票预测", "thesis_type": "本科毕业论文"})
    assert r_off.status_code == 200
    d_off = r_off.json()
    assert d_off["accepted"] is False
    assert len(d_off["topics"]) >= 3
    _assert_no_emoji(d_off.get("message", "") + d_off.get("mentor_note", ""), "topics_off")

    # 2. 朱子文化正常拟题
    r_ok = client.post("/api/thesis/topics", json={"keyword": "白鹿洞书院学规与大学育人", "thesis_type": "本科毕业论文", "discipline": "武夷书院与儒家教育"})
    assert r_ok.status_code == 200
    d_ok = r_ok.json()
    assert d_ok["accepted"] is True and len(d_ok["topics"]) >= 3
    for t in d_ok["topics"]:
        _assert_no_emoji(t["title"] + t.get("problem", ""), "topic_item")
    print("[PASS] test_domain_guard_and_topics 领域护栏与智能拟题通过！")


def test_dynamic_citations_and_gbt7714():
    client = TestClient(app)
    r = client.post(
        "/api/thesis/citations/search",
        json={"topic": "论朱熹格物致知与武夷精舍教育实践", "query": "格物致知 读书法", "top_k": 5},
    )
    assert r.status_code == 200
    data = r.json()
    cits = data["citations"]
    assert len(cits) >= 3, f"特藏引文召回不足: {data}"
    for c in cits:
        assert c["book_title"] and c["call_number"] and c["quote"]
        assert "[M]." in c["gbt7714"] or "[C]." in c["gbt7714"] or "[G]." in c["gbt7714"]
        _assert_no_emoji(c["book_title"] + c["quote"] + c["gbt7714"], "citation")
    print(f"[PASS] test_dynamic_citations_and_gbt7714 检出 {len(cits)} 条真实馆藏引文与 GB/T 7714 格式！")
    return cits


def test_outline_assist_review_defense_and_exports():
    client = TestClient(app)
    cits = test_dynamic_citations_and_gbt7714()
    topic = "论朱熹“格物致知”工夫论与武夷书院通识育人价值"

    # 1. 离题大纲应拒绝 400
    r_bad = client.post("/api/thesis/outline/generate", json={"topic": "Python神经网络股票量化系统"})
    assert r_bad.status_code == 400

    # 2. 朱子文化三级大纲生成
    r_out = client.post(
        "/api/thesis/outline/generate",
        json={"topic": topic, "thesis_type": "本科毕业论文", "discipline": "武夷书院与儒家教育", "target_words": 6000, "citations": cits},
    )
    assert r_out.status_code == 200
    outline = r_out.json()
    assert outline["abstract"] and len(outline["chapters"]) >= 3
    _assert_no_emoji(outline["abstract"] + outline["chapters"][0]["title"], "outline")

    # 3. 分章流式起草 + 论证诊断
    ch0 = outline["chapters"][0]
    r_stream = client.post(
        "/api/thesis/assist/stream",
        json={
            "action": "draft",
            "topic": topic,
            "chapter_title": ch0["title"],
            "chapter_summary": ch0["summary"],
            "sections": ch0["sections"],
            "citations": cits,
            "target_words": 800,
            "session_id": "test_thesis_stream_1",
        },
    )
    assert r_stream.status_code == 200
    assert r_stream.headers.get("x-accel-buffering") == "no"
    assert '"type": "token"' in r_stream.text and '"type": "done"' in r_stream.text
    _assert_no_emoji(r_stream.text, "assist_stream")

    # 填充示例正文用于审稿、答辩与导出校验
    ch0["content"] = (
        "### 1.1 研究背景与问题提出\n\n"
        "朱熹一生讲学武夷隐屏峰下与建阳考亭，将《大学》“格物致知”确立为儒家入德进学之总枢。"
        "依托武夷学院逸夫图书馆所藏《四书章句集注》与《朱子语类》原典，本文旨在澄清后世对格物工夫的片面理解[1]。\n\n"
        "> 所谓致知在格物者，言欲致吾之知，在即物而穷其理也。[1]"
    )

    project = {
        "title": topic,
        "thesis_type": "本科毕业论文",
        "discipline": "武夷书院与儒家教育",
        "target_words": 6000,
        "author_name": "林清远",
        "student_id": "2023010188",
        "college": "武夷学院人文与教师教育学院",
        "advisor": "张教授",
        "problem_statement": outline.get("problem_statement", ""),
        "literature_review_guide": outline.get("literature_review_guide", ""),
        "abstract": outline["abstract"],
        "keywords": outline["keywords"],
        "chapters": outline["chapters"],
        "citations": cits,
    }

    # 4. 五维学术体检
    r_rev = client.post("/api/thesis/review", json={"project": project})
    assert r_rev.status_code == 200
    rev = r_rev.json()
    assert 0 <= rev["overall_score"] <= 100 and len(rev["dimensions"]) >= 4
    _assert_no_emoji(rev.get("mentor_verdict", "") + rev.get("grade", ""), "review")
    project["review"] = rev

    # 5. 互动式模拟答辩（命制质询 + 评阅陈词）
    r_dq = client.post("/api/thesis/defense", json={"action": "questions", "project": project})
    assert r_dq.status_code == 200
    qs = r_dq.json()["questions"]
    assert len(qs) >= 2
    _assert_no_emoji(qs[0]["question"], "defense_q")

    r_short = client.post("/api/thesis/defense", json={"action": "evaluate", "project": project, "question": qs[0]["question"], "answer": "太短"})
    assert r_short.status_code == 400

    r_de = client.post(
        "/api/thesis/defense",
        json={
            "action": "evaluate",
            "project": project,
            "question": qs[0]["question"],
            "answer": "各位评委好，本文紧扣《四书章句集注》与《朱子语类》一手原典，将格物致知还原为穷理与居敬相须的工夫整体，从而回应当代通识教育的德智融合诉求。",
        },
    )
    assert r_de.status_code == 200
    ev = r_de.json()
    assert 0 <= ev["score"] <= 100 and ev.get("comment")
    _assert_no_emoji(ev["comment"] + ev.get("model_answer", ""), "defense_eval")

    # 6. 导出校验：Word 完整论文版 (.docx) + Word 开题报告书版 (.docx) + Markdown (.md)
    for template in ("full", "proposal"):
        # Markdown
        r_md = client.post("/api/thesis/export", json={"project": project, "format": "md", "template": template})
        assert r_md.status_code == 200
        assert "attachment;" in r_md.headers.get("content-disposition", "")
        md_text = r_md.text
        assert topic in md_text and "GB/T 7714-2015" in md_text
        _assert_no_emoji(md_text, f"md_{template}")

        # Word .docx
        r_doc = client.post("/api/thesis/export", json={"project": project, "format": "docx", "template": template})
        assert r_doc.status_code == 200
        assert "wordprocessingml.document" in r_doc.headers.get("content-type", "")
        raw_bytes = r_doc.content
        assert zipfile.is_zipfile(io.BytesIO(raw_bytes)), f"导出的 {template} .docx 不是有效压缩包"

        parsed_doc = docx.Document(io.BytesIO(raw_bytes))
        all_text = "\n".join(p.text for p in parsed_doc.paragraphs)
        for tbl in parsed_doc.tables:
            for row in tbl.rows:
                all_text += "\n" + " ".join(cell.text for cell in row.cells)

        assert topic in all_text, f"{template} Word 文档缺少题目"
        assert "林清远" in all_text and "2023010188" in all_text, f"{template} Word 文档缺少封面署名信息"
        assert "参考文献" in all_text and cits[0]["call_number"] in all_text, f"{template} Word 文档缺少参考文献或馆藏索书号"
        _assert_no_emoji(all_text, f"docx_{template}")

    # 7. 导入 .docx 草稿校验
    sample_doc = docx.Document()
    sample_doc.add_paragraph("考亭书院讲学实录草稿：学者先须立志，然后格物穷理。")
    sample_buf = io.BytesIO()
    sample_doc.save(sample_buf)
    r_imp = client.post(
        "/api/thesis/import-draft",
        files={"file": ("my_draft.docx", sample_buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert r_imp.status_code == 200
    imp_data = r_imp.json()
    assert "格物穷理" in imp_data["text"] and imp_data["char_count"] >= 15

    r_bad_ext = client.post("/api/thesis/import-draft", files={"file": ("malware.exe", b"MZ", "application/octet-stream")})
    assert r_bad_ext.status_code == 400

    print("[PASS] test_outline_assist_review_defense_and_exports 全流程与双模板 Word/Markdown 导出校验通过！")


if __name__ == "__main__":
    test_domain_guard_and_topics()
    test_outline_assist_review_defense_and_exports()
    print("\n[SUCCESS] 朱子文化论文写作系统全部单元测试均已圆满通过！")

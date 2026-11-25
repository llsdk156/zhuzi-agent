"""
朱子典籍知识库检索、简繁归一化、安全防护与动态挂载单元测试
"""

import os
import sys
import tempfile
import time

# 保证控制台输出 UTF-8
if hasattr(sys.stdout, "encoding") and sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag.rag_service import HybridKnowledgeBase, rag_service


def test_base_corpus_loaded():
    stats = rag_service.get_stats()
    print(f"当前知识库切片总数: {stats['total_chunks']}, 典籍总数: {len(stats.get('indexed_sources', []))}")
    assert stats["total_chunks"] > 0, "知识库切片数不应为0"
    assert stats["base_corpus_count"] >= 6, "基础文献数应至少有6部"
    assert len(stats.get("indexed_sources", [])) >= 6, "indexed_sources 列表不应为空"
    print("[PASS] test_base_corpus_loaded 通过！")


def test_search_core_concepts():
    # 测试理一分殊
    res1 = rag_service.search("理一分殊", top_k=3)
    assert len(res1) > 0, "应能检索到理一分殊相关文献"
    assert any("理一分殊" in c["content"] or "月印万川" in c["content"] or "理" in c["content"] for c in res1)
    print("[PASS] test_search 理一分殊 命中正确！")

    # 测试朱子读书法（兼容新版完整全本语料命名）
    res2 = rag_service.search("循序渐进 熟读精思", top_k=3)
    assert len(res2) > 0, "应能检索到朱子读书法文献"
    assert any("读书法" in c["source"] or "熟读" in c["content"] or "熟讀" in c["content"] for c in res2)
    print("[PASS] test_search 朱子读书法 命中正确！")

    # 测试白鹿洞学规（验证简体查询命中繁体原典）
    res3 = rag_service.search("白鹿洞 惩忿窒欲", top_k=3)
    assert len(res3) > 0, "应能检索到白鹿洞学规文献"
    assert any("白鹿洞" in c["source"] or "白鹿洞" in c["content"] for c in res3)
    print("[PASS] test_search 白鹿洞学规（简繁归一化）命中正确！")


def test_long_query_bm25_performance():
    long_query = ("请先生结合朱子语类与大学章句详述格物致知理一分殊与读书六法修身工夫" * 45)
    t0 = time.perf_counter()
    res = rag_service.search(long_query, top_k=4)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"1600+ 字长查询倒排 BM25 检索耗时: {elapsed_ms:.2f} ms (命中 {len(res)} 条)")
    assert len(res) > 0
    assert elapsed_ms < 150.0, f"倒排 BM25 检索耗时过高: {elapsed_ms:.2f} ms"
    print("[PASS] test_long_query_bm25_performance 性能测试通过！")


def test_dynamic_custom_document_isolated():
    """在独立临时目录中验证自定义文献即时挂载与路径穿越防护，不污染项目目录"""
    with tempfile.TemporaryDirectory(prefix="zhuzi_rag_test_") as tmp_dir:
        os.makedirs(os.path.join(tmp_dir, "data", "base_corpus"), exist_ok=True)
        os.makedirs(os.path.join(tmp_dir, "data", "custom_corpus"), exist_ok=True)

        svc = HybridKnowledgeBase(base_dir=tmp_dir)

        test_title = "测试_考亭书院特色碑记.txt"
        test_content = (
            "# 考亭书院特色碑记\n"
            "宋理宗淳祐四年，御书“考亭书院”四字赐建阳，以彰朱文公阐明斯道之功。\n"
            "碑文曰：理学大成，考亭是萃。四海儒宗，山高水长。"
        )
        chunks_count = svc.add_custom_document(test_title, test_content)
        assert chunks_count > 0

        res = svc.search("考亭是萃 四海儒宗", top_k=1)
        assert len(res) > 0
        assert "考亭" in res[0]["content"] or "四海儒宗" in res[0]["content"]

        # 路径穿越防护验证：必须拦截含 ../ 的非法文件名
        rejected = False
        try:
            svc.add_custom_document("../../outside_evil.txt", "evil")
        except ValueError:
            rejected = True
        assert rejected, "必须拒绝包含路径穿越的文件名"

    print("[PASS] test_dynamic_custom_document_isolated 隔离挂载与安全防护通过！")


if __name__ == "__main__":
    test_base_corpus_loaded()
    test_search_core_concepts()
    test_long_query_bm25_performance()
    test_dynamic_custom_document_isolated()
    print("\n[SUCCESS] 全部知识库与 RAG 检索测试均已圆满通过！")

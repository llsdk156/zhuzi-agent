"""
朱子典籍知识库检索与动态挂载单元测试
"""

import os
import sys

# 保证控制台输出 UTF-8
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag.rag_service import rag_service


def test_base_corpus_loaded():
    stats = rag_service.get_stats()
    print(f"当前知识库切片总数: {stats['total_chunks']}")
    assert stats["total_chunks"] > 0, "知识库切片数不应为0"
    assert stats["base_corpus_count"] >= 6, "基础文献数应至少有6部"
    print("[PASS] test_base_corpus_loaded 通过！")


def test_search_core_concepts():
    # 测试理一分殊
    res1 = rag_service.search("理一分殊", top_k=2)
    assert len(res1) > 0, "应能检索到理一分殊相关文献"
    assert any("理一分殊" in c["content"] or "月印万川" in c["content"] for c in res1)
    print("[PASS] test_search 理一分殊 命中正确！")

    # 测试朱子读书法
    res2 = rag_service.search("循序渐进 熟读精思", top_k=2)
    assert len(res2) > 0, "应能检索到朱子读书法文献"
    assert any("朱子读书法" in c["source"] for c in res2)
    print("[PASS] test_search 朱子读书法 命中正确！")

    # 测试白鹿洞学规
    res3 = rag_service.search("白鹿洞 惩忿窒欲", top_k=2)
    assert len(res3) > 0, "应能检索到白鹿洞学规文献"
    assert any("白鹿洞" in c["source"] for c in res3)
    print("[PASS] test_search 白鹿洞学规 命中正确！")


def test_dynamic_custom_document():
    # 模拟用户后续传入特色文献
    test_title = "测试_考亭书院特色碑记.txt"
    test_content = """# 考亭书院特色碑记
宋理宗淳祐四年，御书“考亭书院”四字赐建阳，以彰朱文公阐明斯道之功。
碑文曰：理学大成，考亭是萃。四海儒宗，山高水长。"""

    # 动态写入并重新加载
    chunks_count = rag_service.add_custom_document(test_title, test_content)
    assert chunks_count > 0

    # 检索特色文献独有关键词
    res = rag_service.search("考亭是萃 四海儒宗", top_k=1)
    assert len(res) > 0
    assert "考亭" in res[0]["content"] or "四海儒宗" in res[0]["content"]
    print("[PASS] test_dynamic_custom_document 特色文献即时挂载与检索验证通过！")

    # 清理测试文件
    test_path = os.path.join(rag_service.custom_corpus_dir, test_title)
    if os.path.exists(test_path):
        os.remove(test_path)
    rag_service.load_all_corpora()


if __name__ == "__main__":
    test_base_corpus_loaded()
    test_search_core_concepts()
    test_dynamic_custom_document()
    print("\n[SUCCESS] 全部知识库与 RAG 检索测试均已圆满通过！")


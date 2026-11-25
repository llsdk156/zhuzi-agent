"""
朱子文化知识库与混合检索服务 (RAG Service)
支持加载网络基础权威文献与用户后续传入的特色文献
采用倒排索引 + 停用词过滤 + 多粒度 n-gram BM25 检索，线程安全热重载
"""

import os
import re
import math
import threading
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict

# 常见现代汉语与问答虚词（降低单字噪音，防止长句无关词淹没理学专词）
CHINESE_STOPWORDS = frozenset(
    "的了在是我有和就不人都一个上也很到说要去你会着没有看好好这那"
    "吗呢啊吧呀哦嗯哇嘛么怎什为啥谁哪请问题可否能否可以如何怎么"
    "一下关于什么东西时候因为所以如果但是而且或者还是已经正在"
)

# 理学古籍高频繁简归一化映射（确保简体提问也能精准命中《朱子语类》《白鹿洞学规》《近思录》等繁体原典）
_TRAD_TO_SIMP = str.maketrans({
    "讀": "读", "書": "书", "學": "学", "問": "问", "說": "说", "論": "论", "語": "语", "類": "类",
    "誠": "诚", "經": "经", "傳": "传", "義": "义", "禮": "礼", "懲": "惩", "慾": "欲", "進": "进",
    "漸": "渐", "體": "体", "氣": "气", "為": "为", "無": "无", "與": "与", "應": "应", "窮": "穷",
    "盡": "尽", "當": "当", "實": "实", "聖": "圣", "賢": "贤", "講": "讲", "規": "规", "習": "习",
    "記": "记", "詩": "诗", "圖": "图", "陰": "阴", "陽": "阳", "萬": "万", "處": "处", "動": "动",
    "靜": "静", "見": "见", "聞": "闻", "觀": "观", "覺": "觉", "點": "点", "極": "极", "綱": "纲",
    "條": "条", "節": "节", "達": "达", "過": "过", "遷": "迁", "獨": "独", "養": "养", "發": "发",
    "雜": "杂", "離": "离", "開": "开", "關": "关", "門": "门", "長": "长", "師": "师", "廣": "广",
    "這": "这", "箇": "个", "來": "来", "從": "从", "須": "须", "蓋": "盖", "豈": "岂", "雖": "虽",
    "則": "则", "於": "于", "後": "后", "復": "复", "親": "亲", "愛": "爱", "齊": "齐", "國": "国",
    "業": "业", "樂": "乐", "澤": "泽", "專": "专", "謹": "谨", "嚴": "严", "肅": "肃", "亂": "乱",
    "慮": "虑", "憂": "忧", "懼": "惧", "歡": "欢", "辭": "辞", "辯": "辩", "證": "证", "釋": "释",
    "註": "注", "補": "补", "總": "总", "錄": "录", "編": "编", "輯": "辑", "訓": "训", "詁": "诂",
    "務": "务", "時": "时", "機": "机", "會": "会", "執": "执", "擇": "择", "據": "据", "捨": "舍",
    "顯": "显", "隱": "隐", "微": "微", "著": "着", "貫": "贯", "歸": "归", "終": "终", "始": "始",
    "藝": "艺", "術": "术", "數": "数", "象": "象", "變": "变", "化": "化", "運": "运", "轉": "转",
    "虛": "虚", "靈": "灵", "眾": "众", "異": "异", "同": "同", "別": "别", "對": "对", "錯": "错",
    "難": "难", "易": "易", "輕": "轻", "重": "重", "遠": "远", "近": "近", "深": "深", "淺": "浅",
    "斷": "断", "續": "续", "積": "积", "累": "累", "疊": "叠", "歲": "岁", "歷": "历", "朝": "朝",
    "廷": "廷", "舉": "举", "興": "兴", "廢": "废", "滅": "灭", "存": "存", "漢": "汉", "陸": "陆",
    "淵": "渊", "張": "张", "載": "载", "頤": "颐", "顥": "颢", "顏": "颜", "曾": "曾", "孫": "孙",
})


def is_valid_corpus_filename(fname: str) -> bool:
    """过滤系统文件、隐藏文件、路径穿越及乱码文件"""
    if not fname or "/" in fname or "\\" in fname or ".." in fname:
        return False
    if not fname.endswith(('.txt', '.md')) or fname.startswith('.'):
        return False
    if fname.startswith('README'):
        return False
    if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', fname):
        return False
    return True


def _clean_book_title(fname: str) -> str:
    """提取用于标题匹配的纯净典籍名称，去除编号与冗余后缀"""
    name = re.sub(r'\.(txt|md)$', '', fname, flags=re.IGNORECASE)
    name = re.sub(r'^\d+_', '', name)
    name = re.sub(r'_(?:完整全本|全本|理学诗注全本|特色专著|协同创新文丛)$', '', name)
    return name


class DocumentChunk:
    def __init__(self, doc_id: str, title: str, content: str, source: str, chunk_index: int):
        self.doc_id = doc_id
        self.title = title
        self.clean_title = _clean_book_title(source)
        self.content = content.strip()
        self.source = source
        self.chunk_index = chunk_index

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "title": self.title,
            "content": self.content,
            "source": self.source,
            "chunk_index": self.chunk_index,
        }


class _IndexSnapshot:
    """不可变索引快照，实现重载期间零锁并发安全读"""
    __slots__ = ("chunks", "doc_lens", "doc_freq", "inverted_index", "total_docs", "avg_doc_len")

    def __init__(
        self,
        chunks: List[DocumentChunk],
        doc_lens: List[int],
        doc_freq: Dict[str, int],
        inverted_index: Dict[str, List[Tuple[int, int]]],
        avg_doc_len: float,
    ):
        self.chunks = chunks
        self.doc_lens = doc_lens
        self.doc_freq = doc_freq
        self.inverted_index = inverted_index
        self.total_docs = len(chunks)
        self.avg_doc_len = avg_doc_len


class HybridKnowledgeBase:
    """
    轻量级高效倒排索引 BM25 知识库：
    1. 归一化切词与倒排索引完全一致，毫秒级检索（1500字长查询 < 15ms）。
    2. 按字词粒度加权（三字词 > 二字词 > 有效单字），过滤虚词防止误命中。
    3. 原子快照替换，避免并发重载引发 IndexError。
    """

    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            self.project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        else:
            self.project_dir = base_dir

        self.base_corpus_dir = os.path.join(self.project_dir, "data", "base_corpus")
        self.custom_corpus_dir = os.path.join(self.project_dir, "data", "custom_corpus")
        self.ebooks_download_dir = os.path.join(self.project_dir, "data", "ebooks_download")

        self._reload_lock = threading.Lock()
        self._snapshot = _IndexSnapshot([], [], {}, {}, 1.0)
        self.load_all_corpora()

    @property
    def chunks(self) -> List[DocumentChunk]:
        return self._snapshot.chunks

    @property
    def doc_freq(self) -> Dict[str, int]:
        return self._snapshot.doc_freq

    @property
    def total_docs(self) -> int:
        return self._snapshot.total_docs

    @property
    def avg_doc_len(self) -> float:
        return self._snapshot.avg_doc_len

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """针对中文古文与现代汉语的繁简归一化 + 片段化 n-gram 分词"""
        if not text:
            return []
        norm = text.lower().translate(_TRAD_TO_SIMP)
        segments = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z0-9]+', norm)
        tokens: List[str] = []
        for seg in segments:
            if seg.isascii():
                if len(seg) >= 2:
                    tokens.append(seg)
                continue
            n = len(seg)
            for i in range(n):
                ch = seg[i]
                if ch not in CHINESE_STOPWORDS:
                    tokens.append(ch)
                if i + 1 < n:
                    tokens.append(seg[i:i + 2])
                if i + 2 < n:
                    tokens.append(seg[i:i + 3])
        return tokens

    def _chunk_text(self, text: str, source_name: str, max_chunk_len: int = 420) -> List[DocumentChunk]:
        """按段落或小节智能切块，保留理学引文完整性"""
        raw_paragraphs = re.split(r'\n(?=#{1,4}\s+|一、|二、|三、|四、|五、|六、|【)', text)
        chunks: List[DocumentChunk] = []
        c_idx = 0

        for para in raw_paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(para) > max_chunk_len:
                sub_parts = re.split(r'(?<=[。！？；])\s*', para)
                curr_buffer = ""
                for part in sub_parts:
                    if not part:
                        continue
                    if len(curr_buffer) + len(part) < max_chunk_len:
                        curr_buffer += part + "\n"
                    else:
                        if curr_buffer.strip():
                            chunks.append(DocumentChunk(
                                doc_id=f"{source_name}_{c_idx}",
                                title=source_name,
                                content=curr_buffer,
                                source=source_name,
                                chunk_index=c_idx
                            ))
                            c_idx += 1
                        curr_buffer = part + "\n"
                if curr_buffer.strip():
                    chunks.append(DocumentChunk(
                        doc_id=f"{source_name}_{c_idx}",
                        title=source_name,
                        content=curr_buffer,
                        source=source_name,
                        chunk_index=c_idx
                    ))
                    c_idx += 1
            else:
                chunks.append(DocumentChunk(
                    doc_id=f"{source_name}_{c_idx}",
                    title=source_name,
                    content=para,
                    source=source_name,
                    chunk_index=c_idx
                ))
                c_idx += 1

        return chunks

    def load_all_corpora(self):
        """遍历读取全部基础文献及特色文献，构建倒排索引并原子切换"""
        with self._reload_lock:
            new_chunks: List[DocumentChunk] = []
            dirs_to_scan = [self.base_corpus_dir, self.custom_corpus_dir, self.ebooks_download_dir]
            for corpus_dir in dirs_to_scan:
                if not os.path.exists(corpus_dir):
                    os.makedirs(corpus_dir, exist_ok=True)
                    continue

                for fname in sorted(os.listdir(corpus_dir)):
                    if is_valid_corpus_filename(fname):
                        fpath = os.path.join(corpus_dir, fname)
                        if not os.path.isfile(fpath):
                            continue
                        try:
                            with open(fpath, 'r', encoding='utf-8') as f:
                                content = f.read()
                            new_chunks.extend(self._chunk_text(content, fname))
                        except Exception as e:
                            print(f"[RAG] 加载文件失败 {fname}: {e}")

            inverted_index: Dict[str, List[Tuple[int, int]]] = defaultdict(list)
            doc_freq: Dict[str, int] = {}
            doc_lens: List[int] = []
            total_len = 0

            for idx, chunk in enumerate(new_chunks):
                tokens = self._tokenize(chunk.content)
                t_len = max(1, len(tokens))
                doc_lens.append(t_len)
                total_len += t_len

                tf_counts = Counter(tokens)
                for tok, tf in tf_counts.items():
                    inverted_index[tok].append((idx, tf))

            for tok, postings in inverted_index.items():
                doc_freq[tok] = len(postings)

            total_docs = len(new_chunks)
            avg_doc_len = (total_len / total_docs) if total_docs > 0 else 1.0

            self._snapshot = _IndexSnapshot(
                chunks=new_chunks,
                doc_lens=doc_lens,
                doc_freq=doc_freq,
                inverted_index=dict(inverted_index),
                avg_doc_len=avg_doc_len,
            )
            print(f"[RAG] 知识库倒排索引构建完毕，总计收录段落分块: {total_docs} 个，词项: {len(doc_freq)}。")

    def add_custom_document(self, filename: str, content: str) -> int:
        """用户后续传入特色文献时，安全校验文件名后实时写入并更新知识库"""
        raw_name = (filename or "").strip()
        if not raw_name or ".." in raw_name or "/" in raw_name or "\\" in raw_name:
            raise ValueError(f"非法文献文件名（禁止路径穿越）: {filename}")
        safe_name = os.path.basename(raw_name)
        if not is_valid_corpus_filename(safe_name):
            raise ValueError(f"非法文献文件名: {filename}")

        os.makedirs(self.custom_corpus_dir, exist_ok=True)
        dest_path = os.path.realpath(os.path.join(self.custom_corpus_dir, safe_name))
        allowed_root = os.path.realpath(self.custom_corpus_dir)
        if not dest_path.startswith(allowed_root + os.sep):
            raise ValueError("检测到非法文件路径")

        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(content)

        self.load_all_corpora()
        return self.total_docs

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """基于倒排索引 + 多粒度加权 BM25 检索最相关的文献切片"""
        snap = self._snapshot
        if not snap.chunks or not query or not query.strip():
            return []

        # 截断过长查询（如大段文本），兼顾相关性与毫秒级响应
        raw_tokens = self._tokenize(query[:300])
        if not raw_tokens:
            return []

        # 去重并按粒度分配权重（三字词 > 二字词 > 有效单字）
        unique_tokens = dict.fromkeys(raw_tokens)
        k1 = 1.5
        b = 0.75
        n_docs = snap.total_docs
        avg_dl = snap.avg_doc_len

        scores: Dict[int, float] = defaultdict(float)

        for q_tok in unique_tokens:
            postings = snap.inverted_index.get(q_tok)
            if not postings:
                continue
            df = len(postings)
            idf = math.log((n_docs - df + 0.5) / (df + 0.5) + 1.0)

            tok_len = len(q_tok)
            if q_tok.isascii():
                weight = 1.6
            elif tok_len >= 3:
                weight = 2.6
            elif tok_len == 2:
                weight = 1.6
            else:
                weight = 0.25

            for doc_idx, tf in postings:
                dl = snap.doc_lens[doc_idx]
                denom = tf + k1 * (1.0 - b + b * (dl / avg_dl))
                scores[doc_idx] += weight * idf * (tf * (k1 + 1.0) / denom)

        if not scores:
            return []

        # 轻量且有上限的书名加权（优先匹配原典书名，杜绝长副标题劫持）
        query_phrases = [t for t in unique_tokens if len(t) >= 2 and not t.isascii()]
        if query_phrases:
            for idx, chunk in enumerate(snap.chunks):
                if idx not in scores:
                    continue
                primary_title = chunk.clean_title.split("_")[0]
                exact_3 = sum(1 for t in query_phrases if len(t) >= 3 and t in primary_title)
                matched_2 = sum(1 for t in query_phrases if len(t) == 2 and t in primary_title)
                if exact_3 > 0:
                    scores[idx] = scores[idx] * 1.35 + min(12.0, exact_3 * 4.0)
                elif matched_2 > 0:
                    scores[idx] += min(4.5, matched_2 * 1.5)

        ranked_indices = sorted(scores.keys(), key=lambda i: scores[i], reverse=True)

        results = []
        for i in ranked_indices[:top_k]:
            sc = scores[i]
            if sc > 0.5:
                item = snap.chunks[i].to_dict()
                item["score"] = round(sc, 3)
                results.append(item)

        return results

    def get_stats(self) -> Dict[str, Any]:
        """获取知识库现状统计"""
        base_files = sorted([f for f in os.listdir(self.base_corpus_dir) if is_valid_corpus_filename(f)]) if os.path.exists(self.base_corpus_dir) else []
        custom_files = sorted([f for f in os.listdir(self.custom_corpus_dir) if is_valid_corpus_filename(f)]) if os.path.exists(self.custom_corpus_dir) else []
        ebooks_files = sorted([f for f in os.listdir(self.ebooks_download_dir) if is_valid_corpus_filename(f)]) if os.path.exists(self.ebooks_download_dir) else []
        all_sources = base_files + ebooks_files + custom_files
        return {
            "total_chunks": self.total_docs,
            "base_corpus_count": len(base_files),
            "custom_corpus_count": len(custom_files),
            "ebooks_download_count": len(ebooks_files),
            "base_files": base_files,
            "custom_files": custom_files,
            "ebooks_files": ebooks_files,
            "indexed_sources": all_sources
        }


# 全局单例
rag_service = HybridKnowledgeBase()

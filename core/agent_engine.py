# -*- coding: utf-8 -*-
"""
朱子文化特色智能体 - 核心推理与多轮上下文记忆认知引擎 (Agent Engine)
第一人称朱熹自述 · 古文原典与现代白话交融 · 密闭域 RAG 考据 · 线程安全多会话隔离
"""

import os
import re
import json
import time
import base64
import threading
import urllib.request
import urllib.error
from typing import List, Dict, Any, Generator, Optional, Tuple

try:
    from dotenv import load_dotenv
    _ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(_ENV_FILE):
        load_dotenv(_ENV_FILE, override=False)
except ImportError:
    pass

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

from rag.rag_service import rag_service
from core.opac_service import opac_service
from core.prompt_templates import (
    ZHU_XI_SYSTEM_PROMPT,
    GALGAME_LECTURE_PROMPT,
    READING_METHOD_PROMPT,
    ACADEMY_RULES_PROMPT,
    TEXT_EXEGESIS_PROMPT,
    POETRY_APPRECIATION_PROMPT,
    PHILOSOPHICAL_DEBATE_PROMPT,
    ANCIENT_LETTER_PROMPT,
)


# ==========================================
# 1. 温和文本净化与流式状态机清洗器
# ==========================================

# 仅清除可能泄漏的系统内部调试/规则注记，保留正常书目版本、纪年、架位与 Markdown 链接
_SYSTEM_META_PAREN_RE = re.compile(
    r'[\(（]\s*(?:注[:：][^\)）\n]*(?:系统|规则|内部|提示|AI|模型|自动生成)|系统提示|提示词|内部规则|无括号|AI\s*注)[^\)）\n]*[\)）]'
)


def clean_system_notes(text: str) -> str:
    """温和净化系统规则泄漏注记，不再粗暴删除正常书目版本/纪年/链接括号"""
    if not text:
        return ""
    t = _SYSTEM_META_PAREN_RE.sub("", text)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t


# 向下兼容别名
strip_parentheses = clean_system_notes


# 需要严格保护、绝不替换为“老夫”的专有名词与著者署名
_PROTECTED_PROPER_NOUNS = [
    "武夷学院朱子学研究中心", "朱子学研究中心", "朱子文化协同创新", "朱子特藏专柜", "朱子特藏",
    "朱子文化在海外", "朱子的诗和远方", "世纪之交的朱子学", "朱子三代与政和", "福建朱子学",
    "朝圣朱子", "朱子治家格言", "朱子读书六法", "朱子读书法", "朱子文化", "朱子书院",
    "朱子行教", "朱子故里", "朱子理学", "朱子诗词", "朱子家训", "朱子家礼", "朱子社仓",
    "朱子全书", "朱子语类", "朱子文集", "朱子学", "朱子像", "考亭书院", "武夷学院",
    "紫阳楼", "建阳考亭", "宋·朱熹、吕祖谦", "宋·朱熹", "朱熹、吕祖谦", "朱熹与武夷精舍",
    "晦庵先生朱文公文集", "朱文公文集", "朱文公",
]


def sanitize_zhuxi_first_person(text: str) -> str:
    """
    精准第一人称净化：
    1. 完整保护【参考资料】馆藏溯源区块、所有《...》典籍书名与权威专有名词；
    2. 仅将对朱熹本人的第三人称误称转为“老夫”，绝不误伤孔子、孟子、二程、屈原、戴震等先贤的“他/作者/诗人”；
    3. 温和清除系统规则泄漏注记，绝不把圆括号粗暴替换为“——”。
    """
    if not text:
        return ""

    # 切分【参考资料】区块，确保馆藏元数据（如“著者：宋·朱熹 著”）原封不动
    prov_marker = "【参考资料】"
    if prov_marker in text:
        body, prov = text.split(prov_marker, 1)
        return sanitize_zhuxi_first_person(body) + prov_marker + prov

    t = clean_system_notes(text)

    protected: List[str] = []

    def _protect(match_or_str) -> str:
        val = match_or_str.group(0) if hasattr(match_or_str, "group") else match_or_str
        tok = f"__KT_PROT_{len(protected)}__"
        protected.append(val)
        return tok

    # 保护全部《...》书名与 Markdown 链接 [text](url)
    t = re.sub(r'《[^》\n]+》', _protect, t)
    t = re.sub(r'\[[^\]\n]+\]\([^\)\n]+\)', _protect, t)

    for noun in _PROTECTED_PROPER_NOUNS:
        if noun in t:
            t = t.replace(noun, _protect(noun))

    # 修正极少数把朱熹说成“后学/他者”的口误
    t = re.sub(r'我乃(?:南宋理学家)?(?:朱熹|朱子|老夫)?之后学(?:中的一员)?', '老夫乃考亭先生', t)
    t = re.sub(r'我是(?:朱熹|朱子|老夫)之后学(?:中的一员)?', '老夫乃考亭先生', t)
    t = re.sub(r'朱夫子|朱老师|朱爷爷', '考亭先生', t)

    # 仅针对明确指称“朱熹/朱子”本人的第三人称句式做第一人称转化
    replacements = [
        (r'朱熹在此提出|朱子在此提出', '老夫在此提出'),
        (r'朱熹提出|朱子提出', '老夫当年提出'),
        (r'朱熹认为|朱子认为|朱熹觉得|朱子觉得', '老夫以为'),
        (r'朱熹指出|朱子指出', '老夫尝指出'),
        (r'朱熹强调|朱子强调', '老夫一向戒勉门生'),
        (r'朱熹曾说|朱熹尝言|朱熹说|朱子曾说|朱子尝言|朱子说', '老夫尝言'),
        (r'朱熹有句名言|朱子有句名言', '老夫常言'),
        (r'朱熹在|朱子在', '老夫在'),
        (r'关于朱熹学问|关于朱子学问', '关于理学精义'),
        (r'朱熹的|朱子的', '老夫的'),
        (r'我姓朱，名熹', '老夫字元晦，号晦庵'),
        (r'我是朱熹|我是朱子', '老夫字元晦，晚号考亭先生'),
        (r'老夫朱熹|老夫朱子', '老夫'),
        (r'朱熹先生|朱子先生', '老夫'),
        (r'朱熹是|朱子是', '老夫乃'),
    ]
    for pat, repl in replacements:
        t = re.sub(pat, repl, t)

    # 消除叠词
    t = re.sub(r'老夫老夫+', '老夫', t)

    # 还原被保护的书名、链接与专有名词
    for idx, orig in enumerate(protected):
        t = t.replace(f"__KT_PROT_{idx}__", orig)

    return t


class StreamingSanitizer:
    """
    带状态缓冲的 SSE 流式净化器：
    - 绝不在《...》书名内部、专有名词前缀或未闭合系统注记中间截断输出；
    - 避免单 token 替换把《朱子语类》篡改为《老夫语类》；
    - 可选在首条引用块 `> ...` 行末实时注入馆藏角标【1】。
    """

    def __init__(self, inject_citation: bool = True):
        self._buf = ""
        self._inject_citation = inject_citation
        self._citation_injected = False
        self._full_emitted_parts: List[str] = []

    def _find_safe_flush_end(self, buf: str) -> int:
        n = len(buf)
        if n == 0:
            return 0

        # 若存在未闭合的《...》，暂停在《之前刷新
        last_open_book = buf.rfind("《")
        last_close_book = buf.rfind("》")
        if last_open_book > last_close_book and (n - last_open_book) < 40:
            return last_open_book

        # 若处于未闭合的系统注记括号前（仅限短窗口），稍候确认
        last_open_p = max(buf.rfind("("), buf.rfind("（"))
        last_close_p = max(buf.rfind(")"), buf.rfind("）"))
        if last_open_p > last_close_p and (n - last_open_p) < 18:
            tail = buf[last_open_p:]
            if any(k in tail for k in ("注", "系统", "规则", "提示", "内部", "AI")):
                return last_open_p

        # 保留末尾最多 8 个字符作为短语边界缓冲（防“朱”+“熹”或“朱文”+“公”被拆分）
        boundary_chars = "。！？；\n"
        last_punct = max(buf.rfind(c) for c in boundary_chars)
        if last_punct != -1:
            return last_punct + 1

        if n > 14:
            return n - 8
        return 0

    def _apply_inline_citation(self, segment: str) -> str:
        if not self._inject_citation or self._citation_injected:
            return segment
        if re.search(r'【[0-9]{1,2}】|\[[0-9]{1,2}\]', segment):
            self._citation_injected = True
            return segment
        # 仅当完整输出一条以 > 开头的引用行时注入 【1】
        if "> " in segment and "\n" in segment:
            lines = segment.split("\n")
            for i, ln in enumerate(lines):
                if ln.lstrip().startswith("> ") and len(ln.strip()) > 6:
                    if "”" in ln:
                        lines[i] = re.sub(r'”([。！？]?)', r'”\1【1】', ln, count=1)
                    elif "。" in ln:
                        lines[i] = re.sub(r'。', '。【1】', ln, count=1)
                    else:
                        lines[i] = ln + "【1】"
                    self._citation_injected = True
                    return "\n".join(lines)
        return segment

    def feed(self, token: str) -> str:
        if not token:
            return ""
        self._buf += token
        flush_end = self._find_safe_flush_end(self._buf)
        if flush_end <= 0:
            return ""
        chunk = self._buf[:flush_end]
        self._buf = self._buf[flush_end:]
        cleaned = sanitize_zhuxi_first_person(chunk)
        cleaned = self._apply_inline_citation(cleaned)
        if cleaned:
            self._full_emitted_parts.append(cleaned)
        return cleaned

    def flush(self) -> str:
        if not self._buf:
            return ""
        chunk = self._buf
        self._buf = ""
        cleaned = sanitize_zhuxi_first_person(chunk)
        cleaned = self._apply_inline_citation(cleaned)
        if cleaned:
            self._full_emitted_parts.append(cleaned)
        return cleaned

    @property
    def full_text(self) -> str:
        return "".join(self._full_emitted_parts)


def sanitize_sources(sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """清洗引用文献摘要，严格保持真实文献名、文件名与路径"""
    clean_list = []
    for s in sources:
        item = {}
        for k, v in s.items():
            if isinstance(v, str):
                if k in ("source", "filename", "path", "book_key", "bookKey", "bookTitle", "title", "doc_id"):
                    item[k] = v
                else:
                    item[k] = clean_system_notes(v)
            else:
                item[k] = v
        clean_list.append(item)
    return clean_list


def deduplicate_repetitive_text(text: str) -> str:
    """
    仅消除连续复读或死循环重复段落，绝不因正文中再次引用同一句经典名言而截断全文。
    """
    if not text:
        return ""
    parts = re.split(r'([。！？\n])', text)
    cleaned_parts: List[str] = []
    prev_norm = ""
    consecutive_dups = 0
    seen_counts: Dict[str, int] = {}

    i = 0
    while i < len(parts):
        chunk = parts[i]
        sep = parts[i + 1] if i + 1 < len(parts) else ""
        norm_chunk = re.sub(r'\s+', '', chunk)

        if len(norm_chunk) >= 14:
            if norm_chunk == prev_norm:
                consecutive_dups += 1
                i += 2
                continue
            seen_counts[norm_chunk] = seen_counts.get(norm_chunk, 0) + 1
            # 同一长句出现 3 次以上判定为循环复读，跳过该重复句但不粗暴截断后续有效内容
            if seen_counts[norm_chunk] >= 3:
                i += 2
                continue
            prev_norm = norm_chunk
            consecutive_dups = 0

        cleaned_parts.append(chunk + sep)
        i += 2

    return "".join(cleaned_parts).strip()


# ==========================================
# 2. 武夷学院逸夫图书馆特色馆藏溯源映射
# ==========================================

SOURCE_DB_MAP = {
    "wuyi_shici": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_chaosheng": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_fujian": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_zhenghe": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_dongjing": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_century": "武夷学院朱子学研究中心协同创新专库",
    "wuyi_kaoting": "武夷学院朱子学研究中心协同创新专库",
    "wuyi_haiwai": "武夷学院朱子学研究中心国际传播特色库",
    "sishu": "武夷学院图书馆宋明理学特色库",
    "daxue": "武夷学院图书馆宋明理学特色库",
    "zhongyong": "武夷学院图书馆宋明理学特色库",
    "lunyu": "武夷学院图书馆宋明理学特色库",
    "mengzi": "武夷学院图书馆宋明理学特色库",
    "jinsi": "武夷学院图书馆宋明理学特色库",
    "yulei": "武夷学院图书馆宋明理学特色库",
    "huian": "武夷学院图书馆宋明理学特色库",
    "taiji": "武夷学院图书馆宋明理学特色库",
    "ximing": "武夷学院图书馆宋明理学特色库",
    "gangmu": "武夷学院图书馆宋明理学特色库",
    "shijizhuan": "武夷学院图书馆宋明理学特色库",
    "zhouyi": "武夷学院图书馆宋明理学特色库",
    "chuci": "武夷学院图书馆宋明理学特色库",
    "tongmeng": "武夷学院图书馆宋明理学特色库",
    "xuegui": "武夷学院图书馆宋明理学特色库",
}

BOOK_AUTHOR_MAP = {
    "yulei": "宋·黎靖德 编 · 考亭门人实录",
    "jinsi": "宋·朱熹、吕祖谦 共同选编",
    "huian": "宋·朱熹 撰",
    "wuyi_shici": "张建光 著 · 海峡文艺出版社",
    "wuyi_chaosheng": "张建光 著 · 海峡文艺出版社",
    "wuyi_century": "徐公喜 主编 · 协同创新文丛",
    "wuyi_kaoting": "武夷学院朱子学研究中心 编",
    "wuyi_fujian": "福建朱子学研究团队 编",
    "wuyi_zhenghe": "政和县地方志与朱子文化研究会 编",
    "wuyi_haiwai": "戴健 编著 · 海峡文艺出版社",
    "wuyi_dongjing": "武夷学院朱子文化特藏整理小组",
    "sishu": "宋·朱熹 著",
    "daxue": "宋·朱熹 著",
    "zhongyong": "宋·朱熹 著",
    "lunyu": "宋·朱熹 著",
    "mengzi": "宋·朱熹 著",
    "taiji": "宋·朱熹 著",
    "ximing": "宋·朱熹 著",
    "gangmu": "宋·朱熹 著",
    "shijizhuan": "宋·朱熹 著",
    "zhouyi": "宋·朱熹 著",
    "chuci": "宋·朱熹 著",
    "tongmeng": "宋·朱熹 著",
    "xuegui": "宋·朱熹 手订",
}

UNGROUNDED_REFUSAL = (
    "老夫反复检点经笥典籍与武夷学院逸夫图书馆自建馆藏，于贤生所问之事，未见先贤原典与确凿文献记载，实难妄加推断。"
    "先圣有云：知之为知之，不知为不知，是知也。老夫对此实属无能为力，未敢率尔悬断以误后学。"
    "贤生若欲深入求索，可移步武夷学院逸夫图书馆查阅相关专题馆藏，或就四书章句、宋明理学与治学存养之方再与老夫商榷。"
    "\n\n【参考资料】\n"
    "1 《四书章句集注》 | 著者：宋·朱熹 著 | 索书号：B222.12/Z90:10 | 馆藏地点：总馆 - 流通书库 | 来源：武夷学院图书馆宋明理学特色库《四书章句集注_大学章句_完整全本.txt》\n\n"
    "注：以上资料均为武夷学院逸夫图书馆特色馆藏收录典籍，是否为在架纸质藏书请以 OPAC 实时查询为准。\n\n"
    "相关资源 · 点击直达或扫码打开\n"
    "• 宋明理学特色库 · 检索理学文献题录\n"
    "  检索到：《四书章句集注》、《朱子语类》等武夷学院逸夫图书馆自建馆藏典籍"
)


def match_book_record(source_filename: str, query: str = "") -> Tuple[Optional[Dict[str, Any]], str]:
    """将语料文件名或书名精准映射到 OPAC 馆藏数据库记录（严格避免错误归属）"""
    db = opac_service.get_all_books()
    fname = (source_filename or "").lower()

    # 1. 具体专著/原典优先（防止“诗”“文集”误捕《诗集传》《晦庵文集》）
    ordered_rules = [
        (["诗集传", "诗经", "shijizhuan"], "shijizhuan"),
        (["诗和远方", "wuyi_shici"], "wuyi_shici"),
        (["政和", "朱子三代", "wuyi_zhenghe"], "wuyi_zhenghe"),
        (["福建朱子学", "wuyi_fujian"], "wuyi_fujian"),
        (["世纪之交", "协同创新", "wuyi_century"], "wuyi_century"),
        (["考亭论坛", "wuyi_kaoting"], "wuyi_kaoting"),
        (["朝圣", "五夫", "wuyi_chaosheng"], "wuyi_chaosheng"),
        (["海外", "wuyi_haiwai"], "wuyi_haiwai"),
        (["精舍志", "wuyi_dongjing"], "wuyi_dongjing"),
        (["文集", "晦庵", "huian", "九曲", "棹歌", "精舍杂咏"], "huian"),
        (["白鹿洞", "学规", "揭示", "xuegui"], "xuegui"),
        (["童蒙", "家训", "格言", "tongmeng"], "tongmeng"),
        (["语类", "读书法", "yulei"], "yulei"),
        (["近思录", "jinsi"], "jinsi"),
        (["大学", "daxue"], "daxue"),
        (["中庸", "zhongyong"], "zhongyong"),
        (["论语", "lunyu"], "lunyu"),
        (["孟子", "mengzi"], "mengzi"),
        (["四书", "sishu"], "sishu"),
        (["太极", "taiji"], "taiji"),
        (["西铭", "ximing"], "ximing"),
        (["纲目", "资治通鉴", "gangmu"], "gangmu"),
        (["周易", "易本义", "zhouyi"], "zhouyi"),
        (["楚辞", "chuci"], "chuci"),
    ]
    for keywords, key in ordered_rules:
        if any(w in fname for w in keywords):
            if key in db:
                return db[key], key

    # 2. 按书名直接包含匹配
    for k, b in db.items():
        std_clean = b.get("stdTitle", "").replace("《", "").replace("》", "").lower()
        opac_clean = b.get("opacTitle", "").replace("《", "").replace("》", "").lower()
        if k in fname or (std_clean and std_clean in fname) or (opac_clean and opac_clean in fname):
            return b, k

    return db.get("sishu"), "sishu"


def generate_library_provenance_block(query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
    """生成武夷学院逸夫图书馆自建特色库馆藏溯源区块"""
    cited_records = []
    seen_keys = set()

    for c in retrieved_chunks:
        src = c.get("source", "")
        book, key = match_book_record(src, query)
        if book and key not in seen_keys:
            seen_keys.add(key)
            cited_records.append((book, key, src))
            if len(cited_records) >= 3:
                break

    if not cited_records:
        book, key = match_book_record(query, query)
        if book:
            cited_records.append((book, key, book.get("stdTitle", "") + ".txt"))

    lines = ["\n\n【参考资料】"]
    titles_for_related = []
    main_db: Optional[str] = None

    for idx, (b, k, fname) in enumerate(cited_records, start=1):
        std_title = b.get("stdTitle", "《考亭理学典籍》")
        titles_for_related.append(std_title)
        author = BOOK_AUTHOR_MAP.get(k, "宋·朱熹 著")
        call_no = b.get("callNumber", "B222.12/Z90:10")
        loc = b.get("location", "总馆 - 流通书库")
        db_name = SOURCE_DB_MAP.get(k, "武夷学院图书馆宋明理学特色库")
        if main_db is None:
            main_db = db_name

        clean_fname = os.path.basename(fname)
        if not clean_fname.endswith(('.txt', '.md')):
            clean_fname = f"{std_title.replace('《', '').replace('》', '')}.txt"

        lines.append(f"{idx} {std_title} | 著者：{author} | 索书号：{call_no} | 馆藏地点：{loc} | 来源：{db_name}《{clean_fname}》")

    lines.append("\n注：以上资料均为武夷学院逸夫图书馆特色馆藏收录典籍，是否为在架纸质藏书请以 OPAC 实时查询为准。")

    joined_titles = "、".join(titles_for_related) if titles_for_related else "《四书章句集注》、《朱子语类》"
    short_db_title = (main_db or "武夷学院图书馆宋明理学特色库").replace("武夷学院图书馆", "").replace("武夷学院", "")
    lines.append("\n相关资源 · 点击直达或扫码打开")
    lines.append(f"• {short_db_title} · 检索理学文献题录\n  检索到：{joined_titles} 等武夷学院逸夫图书馆自建馆藏典籍")

    return "\n".join(lines)


format_citation = generate_library_provenance_block


def inject_inline_citations(text: str) -> str:
    """在回答正文关键原典引证明训处注入馆藏角标【1】"""
    if not text:
        return ""
    if re.search(r'【[0-9]{1,2}】|\[[0-9]{1,2}\]', text):
        return text
    if "> " in text:
        parts = text.split("> ", 1)
        subparts = parts[1].split("\n", 1)
        first_line = subparts[0]
        if "”" in first_line:
            first_line = re.sub(r'”([。！？]?)', r'”\1【1】', first_line, count=1)
        elif "。" in first_line:
            first_line = re.sub(r'。', '。【1】', first_line, count=1)
        else:
            first_line = first_line + "【1】"
        rest = "\n" + subparts[1] if len(subparts) > 1 else ""
        return parts[0] + "> " + first_line + rest
    return text


# ==========================================
# 3. 精准循证边界护栏（修复双向误判）
# ==========================================

_MODERN_CN_OFFTOPIC = (
    "写代码", "编程", "快速排序", "冒泡排序", "二叉树", "链表", "堆栈", "微服务",
    "前端开发", "后端开发", "写个脚本", "炒股", "股票", "买基金", "比特币", "虚拟货币",
    "区块链", "加密货币", "牛市", "熊市", "a股", "美股", "降准", "加息", "彩票", "双色球",
    "王者荣耀", "原神", "和平精英", "英雄联盟", "黑神话", "游戏攻略",
    "娱乐圈", "八卦", "追星", "明星绯闻", "热搜", "科幻小说", "宇宙黑洞", "黑洞",
    "量子力学", "相对论", "核聚变", "核武器", "光刻机", "半导体", "芯片制造",
    "红烧肉", "菜谱", "食谱", "算命", "星座运势", "塔罗牌", "天气预报", "明天会下雨",
    "美国总统", "现任总统", "世界杯", "足球比赛", "篮球比赛",
)

_MODERN_EN_OFFTOPIC_RE = re.compile(
    r'\b(?:python|java|c\+\+|c#|golang|rust|php|javascript|typescript|html|css|sql|linux|windows|git|github|docker|k8s|api|vue|react|spring|bug|lol|steam|nba)\b',
    re.IGNORECASE,
)

_EXACT_CONTINUATIONS = frozenset({
    "生", "学生", "后生", "弟子", "门人", "后学", "可以", "好", "好的", "对", "是", "是的", "行",
    "愿闻其详", "受教", "受教了", "明白", "明白了", "继续", "接着讲", "往下讲", "请继续",
    "展开讲讲", "详细说说", "举个例子", "请举例", "为什么", "为何", "怎么做", "然后呢",
    "还有吗", "不太懂", "我没听懂", "请先生指点", "先生何意", "如何下手", "请开示", "赞同",
    "没有疑问了", "不需要了", "多谢先生", "谢谢先生", "感谢先生", "谢谢", "多谢",
})

_DOMAIN_CONCEPTS = (
    "朱熹", "朱子", "晦庵", "考亭", "紫阳", "沧洲", "元晦", "仲晦", "先生", "夫子", "山长",
    "四书", "大学", "中庸", "论语", "孟子", "五经", "诗经", "尚书", "礼记", "周易", "易经", "春秋", "孝经",
    "读书法", "六法", "循序渐进", "熟读精思", "虚心涵泳", "切己体察", "着紧用力", "居敬持志",
    "格物致知", "即物穷理", "格物", "穷理", "致知", "理气", "理在气先", "不离不杂",
    "存天理", "灭人欲", "天理", "人欲", "以理杀人", "心统性情", "性即理", "心即理", "未发", "已发", "中和",
    "知行", "知行合一", "理一分殊", "月印万川", "太极", "西铭", "近思录", "语类", "文集", "家礼", "家训", "家风",
    "童蒙须知", "童蒙", "白鹿洞", "学规", "揭示", "鹅湖", "朱陆", "五夫", "社仓", "武夷", "隐屏", "九曲", "棹歌",
    "观书有感", "半亩方塘", "源头活水", "活水", "春日", "精舍", "建阳", "崇安", "政和", "尤溪", "婺源", "南康", "岳麓",
    "资治通鉴", "纲目", "诗集传", "周易本义", "楚辞", "太极图",
    "宋明理学", "理学", "心学", "道学", "闽学", "儒家", "儒学", "国学", "经学", "道统", "天命", "天道", "仁义礼智",
    "性善", "主敬", "涵养", "慎独", "诚意", "正心", "修身", "齐家", "治国", "平天下", "修齐治平", "万物一体", "经世",
    "孔子", "孟子", "颜回", "曾子", "子思", "周敦颐", "程颢", "程颐", "二程", "张载", "李侗", "延平",
    "陆九渊", "象山", "王阳明", "戴震", "王安石", "吕祖谦", "张栻", "黄干", "蔡元定", "韩侂胄", "庆元党禁", "伪学",
    "屈原", "陶渊明", "杜甫", "李白", "苏轼", "司马光",
    "古诗", "诗词", "诗句", "赏析", "作诗", "写诗", "文言", "训诂", "考证", "考据", "古籍", "典籍", "原典",
    "图书馆", "特藏", "索书号", "借阅", "馆藏", "书院", "书单", "推荐书", "读什么书", "先读什么",
    "尺牍", "书信", "信札", "回信", "写信", "考校", "出题", "背诵",
    "武夷茶", "岩茶", "茶理", "茶道", "瀹茗",
    "论文", "毕业论文", "开题", "选题", "学术", "研究", "综述", "答辩", "课题", "文献",
)

_PASTORAL_AND_SELF_TOPICS = (
    "你好", "您好", "在吗", "在不在", "先生好", "请了", "早安", "晚安", "早上好", "下午好", "晚上好", "哈喽", "hello", "hi",
    "你是谁", "你叫什么", "尊姓", "大名", "生平", "朝代", "哪里人", "多大", "几岁", "高寿", "字号", "介绍你自己",
    "我叫", "在下", "鄙人", "记得我", "我的名字", "我是谁", "刚说了什么", "刚才聊了什么", "上一个问题",
    "好累", "不想学", "累了", "学不进去", "心烦", "浮躁", "静不下心", "焦虑", "厌学", "走神", "歇会",
    "躺平", "摆烂", "心累", "好烦", "杂念", "迷茫", "拖延", "懈怠", "挫败", "挫折", "内耗", "压力大",
    "读书", "学习", "自习", "治学", "修养", "品德", "道德", "做人", "处世", "待人", "交友", "朋友", "自律", "自省",
    "教育", "孩子", "家规", "管教", "起居", "早起", "养生", "为官",
    "答非所问", "牛头不对马嘴", "复读机", "太死板",
)


def is_grounded_query(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    session: Optional[Dict[str, Any]] = None,
    mode: str = "qa",
) -> bool:
    """
    精准判断提问是否处于考亭理学与治学修身服务边界内：
    - 讲筵/尺牍/文档等显式模式直接放行；
    - 具备明确理学/国学/读书/修身/文献主题的提问（含跨界探讨如“朱子文化短视频传播”）一律放行；
    - 精确匹配短接续语及多轮上下文追问；
    - 坚决婉拒纯现代编程、股票理财、游戏攻略、食谱算命、科幻小说等无关请求。
    """
    if mode in ("galgame", "letter", "document"):
        return True

    q_raw = (query or "").strip()
    if not q_raw:
        return False
    q_lower = q_raw.lower()
    q_clean = re.sub(r'[？?！!。，,\s]+', '', q_lower)

    # 1. 显式领域概念优先放行（即便是“朱子文化能否做短视频”“朱熹春日翻译英文”也属本馆学术探讨）
    has_domain = any(k in q_lower for k in _DOMAIN_CONCEPTS)
    if has_domain:
        # 仅拦截借朱子名义要求直接写程序代码/荐股的情况
        if any(k in q_lower for k in ("写代码", "写个脚本", "快速排序", "二叉树", "买哪只股票", "推荐股票")):
            return False
        return True

    # 2. 寒暄、身世、日常修身困惑、治学情绪放行
    if any(k in q_lower for k in _PASTORAL_AND_SELF_TOPICS):
        return True

    # 3. 精确匹配门生应答与承接语（修复单字子串“是/好/对/生/行”全放行漏洞）
    if q_clean in _EXACT_CONTINUATIONS:
        return True

    # 4. 纯现代无关领域关键词拦截（中文词组 + 英文词边界）
    if any(k in q_lower for k in _MODERN_CN_OFFTOPIC) or _MODERN_EN_OFFTOPIC_RE.search(q_lower):
        return False

    # 5. 若处于已有历史的多轮对话中，且为常见追问句式，允许承接上下文
    has_history = bool(session and (session.get("history") or session.get("last_question")))
    followup_prefixes = ("那", "然后", "接下来", "还有", "为什么", "为何", "怎么", "如何", "能再", "可以再", "举个", "详细", "具体", "没听懂", "不太明白", "展开")
    if has_history and len(q_clean) <= 24 and any(q_clean.startswith(p) or p in q_clean for p in followup_prefixes):
        return True

    # 6. 纯数字四则运算（兼容既有数理常识趣味问对）
    if re.fullmatch(r'\s*\d+\s*([\+\-\*\/]|加|减|乘|除)\s*\d+\s*[=等于？?吗]*\s*', q_raw):
        return True

    # 7. 原典库高置信匹配（需真正命中较高 BM25 分且非超长乱水句）
    if retrieved_chunks and retrieved_chunks[0].get("score", 0) >= 42.0:
        return True

    return False


def ensure_socratic_question(text: str, query: str) -> str:
    """确保日常问答后半段包含启发式反思设问"""
    if not text:
        return text
    clean = text.strip()
    body_part = clean.split("【参考资料】", 1)[0].rstrip() if "【参考资料】" in clean else clean
    last_window = body_part[-100:] if len(body_part) >= 100 else body_part
    if any(q in last_window for q in ("？", "?")):
        return clean

    q_low = (query or "").lower()
    if any(k in q_low for k in ("知行", "践履")):
        follow_up = "老夫且掩卷问汝：贤生平日研读圣贤之言，觉此知与行何者更难着力？在日常接物处事之际可曾切实体会过？"
    elif any(k in q_low for k in ("读书", "怎么读", "方法", "六法", "循序渐进")):
        follow_up = "老夫且问贤生：汝今日看书，可曾做到字字推敲、掩卷反思？抑或是仍有走马观花之习气？"
    elif any(k in q_low for k in ("累", "心烦", "浮躁", "静不下心", "焦虑")):
        follow_up = "老夫且问贤生：此刻深闭双目敛气三息，胸中纷扰念头可稍有平息？可愿随老夫自一小段功课重新从容着手？"
    elif any(k in q_low for k in ("格物", "穷理", "大学")):
        follow_up = "老夫且问贤生：今日在自身周遭手头之事，汝可曾实地穷格其所以然之一端？"
    else:
        follow_up = "老夫且掩卷设问以验贤生：仁兄体味此节要义，若落在汝自家日用身心之中，当从何处切己下手？"

    if "【参考资料】" in clean:
        parts = clean.split("【参考资料】", 1)
        return parts[0].rstrip() + f"\n\n{follow_up}\n\n【参考资料】" + parts[1]
    return clean + f"\n\n{follow_up}"


# ==========================================
# 4. 线程安全多轮会话上下文管理器（修复丢用户历史与内存泄漏）
# ==========================================

_NAME_INTRO_RE = re.compile(
    r'(?:^|[，。！？、\s])(?:我叫|在下叫?|鄙人姓?|唤我|叫我)\s*([A-Za-z\u4e00-\u9fa5]{2,4})(?=$|[，。！？、\s])'
)
_INVALID_NAMES = frozenset({
    "一个", "一名", "学生", "后生", "学者", "什么", "怎么", "朱熹", "朱子",
    "山长", "先生", "这里", "哪里", "谁啊", "这样", "那样", "问问", "请教",
    "考亭", "紫阳", "晦庵", "文公", "老夫", "自己", "今天", "明天", "什么名",
    "最近", "现在", "平时", "一直", "有点", "非常", "特别",
})


def _extract_user_name(text: str) -> Optional[str]:
    if not text:
        return None
    if any(w in text for w in ("记得我叫", "我叫什么", "我叫啥", "我叫谁", "我叫哪", "知我名", "我叫吗", "我叫？", "我叫?", "名字是啥", "何名")):
        return None
    m = _NAME_INTRO_RE.search(text.strip())
    if not m:
        return None
    cand = m.group(1).rstrip('呢呀啊哦吧，。！？? ')
    if len(cand) >= 2 and cand not in _INVALID_NAMES and not cand.startswith(("什么", "怎么", "如何", "为何")):
        return cand
    return None


class ConversationContextManager:
    """线程安全、带 TTL 清理与完整双向轮次记录的会话管理器"""

    def __init__(self, max_sessions: int = 500, ttl_seconds: int = 7200):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._max_sessions = max_sessions
        self._ttl_seconds = ttl_seconds

    def _evict_expired_unlocked(self, now: float):
        expired = [sid for sid, s in self.sessions.items() if now - s.get("updated_at", now) > self._ttl_seconds]
        for sid in expired:
            self.sessions.pop(sid, None)
        while len(self.sessions) >= self._max_sessions:
            oldest_sid = min(self.sessions, key=lambda k: self.sessions[k].get("updated_at", 0))
            self.sessions.pop(oldest_sid, None)

    def get_or_create(self, session_id: str) -> Dict[str, Any]:
        sid = session_id or "default"
        now = time.time()
        with self._lock:
            if sid not in self.sessions:
                self._evict_expired_unlocked(now)
                self.sessions[sid] = {
                    "session_id": sid,
                    "user_name": None,
                    "history": [],
                    "topics": [],
                    "last_book": None,
                    "prev_question": None,
                    "last_question": "",
                    "last_answer_snippet": "",
                    "thesis_topic": None,
                    "thesis_batch_idx": 0,
                    "created_at": now,
                    "updated_at": now,
                }
            self.sessions[sid]["updated_at"] = now
            return self.sessions[sid]

    def update_with_query(self, session_id: str, query: str, history: Optional[List[Dict[str, str]]] = None):
        sess = self.get_or_create(session_id)
        with self._lock:
            # 1. 若外部显式传入 history（哪怕是 []），以独立深拷贝覆盖服务端历史
            if history is not None:
                copied = []
                for h in history:
                    if isinstance(h, dict) and h.get("role") in ("user", "assistant") and str(h.get("content", "")).strip():
                        copied.append({"role": h["role"], "content": str(h["content"])})
                sess["history"] = copied[-30:]
                for h in sess["history"]:
                    if h["role"] == "user":
                        if not sess.get("user_name"):
                            nm = _extract_user_name(h["content"])
                            if nm:
                                sess["user_name"] = nm
                        bm = re.search(r'《([^》]+)》', h["content"])
                        if bm and not sess.get("last_book"):
                            sess["last_book"] = f"《{bm.group(1)}》"

            # 2. 保存上一轮问题
            if sess.get("last_question") and sess.get("last_question") != query:
                sess["prev_question"] = sess["last_question"]

            # 3. 提取显式自报姓名
            nm_now = _extract_user_name(query)
            if nm_now:
                sess["user_name"] = nm_now

            # 4. 提取提到的典籍书目
            book_match = re.search(r'《([^》]+)》', query)
            if book_match:
                sess["last_book"] = f"《{book_match.group(1)}》"
            else:
                for b in ("大学", "中庸", "论语", "孟子", "资治通鉴", "近思录", "易经", "周易", "诗经", "尚书", "礼记", "春秋", "朱子语类", "传习录"):
                    if b in query:
                        sess["last_book"] = f"《{b}》"
                        break

            # 5. 记录论文专修当前论题方向（支持自拟题目）
            if any(k in query for k in ("论文专修", "选题方向", "毕业论文", "论文题目", "论文选题", "开题")):
                tm = re.search(r'(?:选题方向拟定为|论文题目(?:为|拟定为)|选题(?:为|是))【([^】]+)】', query)
                if not tm:
                    tm = re.search(r'(?:论文题目(?:为|是)|选题(?:为|是)|写一篇关于)[“"《]([^”"》]{4,48})[”"》]', query)
                if tm:
                    sess["thesis_topic"] = tm.group(1).strip()

            sess["last_question"] = query
            sess["updated_at"] = time.time()

    def record_turn(self, session_id: str, query: str, reply: str):
        """原子记录一轮完整问答 (user + assistant)，确保服务端多轮记忆交替完整"""
        sess = self.get_or_create(session_id)
        with self._lock:
            hist = sess["history"]
            # 防止重复追加同一条 user
            if not (hist and hist[-1].get("role") == "user" and hist[-1].get("content") == query):
                hist.append({"role": "user", "content": query})
            hist.append({"role": "assistant", "content": reply})
            if len(hist) > 40:
                sess["history"] = hist[-40:]
            sess["last_answer_snippet"] = reply[:120]
            sess["updated_at"] = time.time()

    def update_with_reply(self, session_id: str, reply: str):
        """向下兼容方法：自动补全当前轮次的 user 与 assistant"""
        sess = self.get_or_create(session_id)
        last_q = sess.get("last_question", "")
        if last_q:
            self.record_turn(session_id, last_q, reply)
        else:
            with self._lock:
                sess["history"].append({"role": "assistant", "content": reply})
                if len(sess["history"]) > 40:
                    sess["history"] = sess["history"][-40:]
                sess["last_answer_snippet"] = reply[:120]
                sess["updated_at"] = time.time()


session_manager = ConversationContextManager()


# ==========================================
# 5. 配置解析（config.yml 为默认，.env 与环境变量高优覆盖）
# ==========================================

def _strip_inline_comment(val: str) -> str:
    """安全剔除未加引号的环境变量行尾 # 注释"""
    val = val.strip()
    if not val:
        return ""
    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
        return val[1:-1].strip()
    if " #" in val:
        val = val.split(" #", 1)[0].strip()
    return val.strip("'").strip('"').strip()


def _load_env_configs() -> Dict[str, str]:
    """安全解析配置：config.yml（忽略空值） < .env（忽略空值） < os.environ"""
    configs: Dict[str, str] = {}
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # 1. 先加载 config.yml 作为默认基准（绝不写入空字符串覆盖后续配置）
    cfg_path = os.path.join(base_dir, "config.yml")
    if os.path.exists(cfg_path):
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if ":" in line and not line.startswith("#"):
                        k, v = line.split(":", 1)
                        k = k.strip()
                        v = _strip_inline_comment(v)
                        if not v:
                            continue
                        if k in ("api_key", "key"):
                            configs["API_KEY"] = v
                        elif k in ("text_model", "model"):
                            configs["LLM_MODEL"] = v
                        elif k == "vision_model":
                            configs["VISION_MODEL"] = v
                        elif k in ("api_base_url", "base_url"):
                            configs["API_BASE_URL"] = v
        except Exception:
            pass

    # 2. 再加载 .env 覆盖 config.yml
    env_path = os.path.join(base_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = _strip_inline_comment(v)
                        if v:
                            configs[k] = v
        except Exception:
            pass

    return configs


def _classify_intent(query: str) -> str:
    """细粒度意图标识（便于可观测性、指标统计与自动化单元测试校验）"""
    q = (query or "").lower()
    if any(k in q for k in ("读书法", "六法", "循序渐进", "熟读精思", "虚心涵泳", "切己体察", "着紧用力", "居敬持志", "读不进去", "怎么读书", "浮躁")):
        return "reading_method"
    if any(k in q for k in ("白鹿洞", "学规", "揭示", "五教", "修身之要", "处事之要", "接物之要")):
        return "academy_rules"
    if any(k in q for k in ("理一分殊", "月印万川", "理气", "太极", "格物致知", "即物穷理", "心统性情", "存天理", "灭人欲", "知行")):
        return "philosophy_ontology"
    if any(k in q for k in ("观书有感", "九曲棹歌", "春日", "写首诗", "古诗", "诗词", "赏析")):
        return "poetry_appreciation"
    if any(k in q for k in ("论文专修", "毕业论文", "开题", "选题", "步骤一", "步骤二", "步骤三", "步骤四", "步骤五", "步骤六")):
        return "thesis_guidance"
    if any(k in q for k in ("尺牍", "写信", "书信", "信札")):
        return "ancient_letter"
    return "general_inquiry"


# ==========================================
# 6. 朱熹智能体核心引擎
# ==========================================

class ZhuXiAgent:
    """朱子文化特色认知智能体核心类"""

    def __init__(self):
        env_cfgs = _load_env_configs()
        self.api_key = (
            os.getenv("API_KEY")
            or os.getenv("ZHIPU_API_KEY")
            or env_cfgs.get("API_KEY")
            or env_cfgs.get("ZHIPU_API_KEY")
            or ""
        ).strip()
        self.api_base_url = (
            os.getenv("API_BASE_URL")
            or env_cfgs.get("API_BASE_URL")
            or "https://open.bigmodel.cn/api/paas/v4"
        ).strip()
        self.llm_model = (
            os.getenv("LLM_MODEL")
            or env_cfgs.get("LLM_MODEL")
            or "glm-4-flash"
        ).strip()
        self.vision_model = (
            os.getenv("VISION_MODEL")
            or env_cfgs.get("VISION_MODEL")
            or "glm-4v-flash"
        ).strip()

        self._stopped_sessions: set = set()
        self._stop_lock = threading.Lock()
        self._http_client = (
            httpx.Client(timeout=httpx.Timeout(connect=10.0, read=35.0, write=15.0, pool=10.0))
            if HAS_HTTPX else None
        )

    def stop_session(self, session_id: str):
        if session_id:
            with self._stop_lock:
                self._stopped_sessions.add(session_id)

    def is_session_stopped(self, session_id: str) -> bool:
        with self._stop_lock:
            return session_id in self._stopped_sessions

    def cleanup_stopped_session(self, session_id: str):
        with self._stop_lock:
            self._stopped_sessions.discard(session_id)

    def _infer_mode(self, session_id: str, mode: Optional[str]) -> str:
        if mode:
            return mode
        sid = session_id or ""
        if sid.startswith("galgame_"):
            return "galgame"
        if sid.startswith("letter_"):
            return "letter"
        return "qa"

    def _build_llm_messages(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        mode: str = "qa",
    ) -> List[Dict[str, str]]:
        """构建送入 LLM 的高质量、无冲突上下文（注入完整 RAG 切片与精准场景提示）"""
        user_name = session.get("user_name")
        last_book = session.get("last_book")
        thesis_topic = session.get("thesis_topic")

        # 讲筵模式（GalGame）与尺牍模式使用专属精简提示，避免与四段式规制冲突
        if mode == "galgame":
            system_parts = [GALGAME_LECTURE_PROMPT]
        elif mode == "letter":
            system_parts = [ANCIENT_LETTER_PROMPT]
        else:
            system_parts = [ZHU_XI_SYSTEM_PROMPT]

        if user_name:
            system_parts.append(f"\n【问学者信息】：当前学者自报姓名/称呼为【{user_name}】，请亲切称其为‘{user_name}仁兄’或‘诸生{user_name}’。")
        if last_book and mode != "letter":
            system_parts.append(f"\n【关注典籍】：当前学者此前研读关注的典籍为【{last_book}】。")
        if thesis_topic and mode == "qa":
            system_parts.append(f"\n【当前论文专修选题】：学者选定的论文题目为【{thesis_topic}】。后续所有步骤指导必须紧扣该选题展开，不可跑偏至其他题目。")

        # 注入 Top 3~4 完整 RAG 切片（约 400 字/段），使用规范原典书名，彻底杜绝引文幻觉
        if retrieved_chunks and mode != "letter":
            rag_texts = []
            max_chunks = 2 if mode == "galgame" else 4
            max_chars = 260 if mode == "galgame" else 420
            for idx, c in enumerate(retrieved_chunks[:max_chunks], start=1):
                src = c.get("source", "考亭典籍")
                book, _ = match_book_record(src, query)
                canonical_title = book.get("stdTitle") if book else f"《{src.replace('.txt', '').replace('.md', '')}》"
                snippet = c.get("content", "").replace("\n", " ").strip()[:max_chars]
                rag_texts.append(f"[{idx}] {canonical_title}：{snippet}")
            system_parts.append("\n\n【考亭书院自建馆藏典籍检索依据（请优先据实引证）】：\n" + "\n".join(rag_texts))

        # 场景细分附加提示（仅限 qa 模式）
        if mode == "qa":
            sess_id = session.get("session_id", "") or ""
            if any(k in query for k in ("读书法", "六法", "循序渐进", "熟读精思", "读不进去")):
                system_parts.append(f"\n{READING_METHOD_PROMPT}")
            elif any(k in query for k in ("白鹿洞", "学规", "揭示")):
                system_parts.append(f"\n{ACADEMY_RULES_PROMPT}")
            elif any(k in query for k in ("训诂", "章句", "字义", "原句解")):
                system_parts.append(f"\n{TEXT_EXEGESIS_PROMPT}")
            elif any(k in query for k in ("观书有感", "半亩方塘", "源头活水", "九曲棹歌", "春日", "诗词", "解诗", "作诗", "赏析", "精舍杂咏")):
                system_parts.append(f"\n{POETRY_APPRECIATION_PROMPT}")
            elif any(k in query for k in ("辩", "是不是科学", "灭绝人性", "以理杀人", "戴震", "朱陆异同", "鹅湖", "王阳明", "争议", "驳")):
                system_parts.append(f"\n{PHILOSOPHICAL_DEBATE_PROMPT}")
            elif sess_id.startswith("recommend_") or any(k in query for k in ("推荐书", "书目", "阅读次第")):
                system_parts.append("\n【沧洲藏书阁指引】：为学者审定《大学》《论语》《孟子》《中庸》及宋明理学进学次第，结合其学力给出实操阅读法门。")

        full_system_prompt = "\n".join(system_parts)
        messages: List[Dict[str, str]] = [{"role": "system", "content": full_system_prompt}]

        # 拼接最近 10 条干净历史（过滤任何 system 角色，防止 Zhipu API 报错）
        chat_hist = history if history is not None else session.get("history", [])
        if chat_hist:
            for h in chat_hist[-10:]:
                r = h.get("role", "")
                c = str(h.get("content", "")).strip()
                if r in ("user", "assistant") and c:
                    # 防止 history 尾部已含本轮 query 造成重复
                    if r == "user" and c == query and h is chat_hist[-1]:
                        continue
                    messages.append({"role": r, "content": c})

        messages.append({"role": "user", "content": query})
        return messages

    def _post_json(self, endpoint: str, payload: Dict[str, Any], timeout: float = 30.0) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        if self._http_client is not None:
            resp = self._http_client.post(endpoint, json=payload, headers=headers, timeout=timeout)
            resp.raise_for_status()
            return resp.json()
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _call_glm(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session_id: str,
        retrieved_chunks: List[Dict[str, Any]],
        mode: str = "qa",
        temperature: float = 0.72,
    ) -> Dict[str, Any]:
        """调用智谱 GLM 大模型同步生成完整解答与精准引注"""
        sess = session_manager.get_or_create(session_id)
        messages = self._build_llm_messages(query, history, sess, retrieved_chunks, mode=mode)
        endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": self.llm_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 500 if mode == "galgame" else 1500,
        }
        data = self._post_json(endpoint, payload, timeout=30.0)
        choices = data.get("choices") or []
        raw_content = (choices[0].get("message", {}).get("content") or "") if choices else ""
        answer_text = raw_content.strip()
        if not answer_text:
            raise ValueError("上游大模型返回空内容")

        answer_text = sanitize_zhuxi_first_person(answer_text)
        answer_text = deduplicate_repetitive_text(answer_text)

        if mode == "qa":
            answer_text = ensure_socratic_question(answer_text, query)
            answer_text = inject_inline_citations(answer_text)
            if not any(k in answer_text for k in ("【参考资料】", "典籍原典出处", "考亭典籍出处")):
                answer_text += generate_library_provenance_block(query, retrieved_chunks)

        session_manager.record_turn(session_id, query, answer_text)
        return {
            "reply": answer_text,
            "intent": _classify_intent(query),
            "sources": sanitize_sources(retrieved_chunks),
            "provider": f"考亭理学书院 · 智谱清言 {self.llm_model}",
            "session_id": session_id,
            "user_name": sess.get("user_name"),
            "fallback": False,
        }

    def _call_glm_stream(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session_id: str,
        retrieved_chunks: List[Dict[str, Any]],
        mode: str = "qa",
        temperature: float = 0.72,
    ) -> Generator[str, None, None]:
        """
        调用智谱 GLM 大模型流式 SSE 吐字：
        - 带状态缓冲净化，保护书名与专有名词；
        - 若已吐出 token 后发生网络中断，不再拼接第二套兜底答案，而是优雅结束并给出断流提示。
        """
        sess = session_manager.get_or_create(session_id)
        messages = self._build_llm_messages(query, history, sess, retrieved_chunks, mode=mode)
        endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        payload = {
            "model": self.llm_model,
            "messages": messages,
            "stream": True,
            "temperature": temperature,
            "max_tokens": 500 if mode == "galgame" else 1500,
        }

        if self.is_session_stopped(session_id):
            yield f"data: {json.dumps({'type': 'done', 'stopped': True}, ensure_ascii=False)}\n\n"
            return

        sanitizer = StreamingSanitizer(inject_citation=(mode == "qa"))
        has_yielded_tokens = False
        intent = _classify_intent(query)

        def _iter_upstream_lines():
            if self._http_client is not None:
                with self._http_client.stream("POST", endpoint, json=payload, headers=headers) as resp:
                    resp.raise_for_status()
                    for line in resp.iter_lines():
                        yield line
            else:
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, timeout=30) as resp:
                    for raw_line in resp:
                        yield raw_line.decode("utf-8", errors="replace")

        try:
            line_iter = _iter_upstream_lines()
            meta_sent = False

            for raw_line in line_iter:
                if self.is_session_stopped(session_id):
                    break

                line_str = (raw_line or "").strip()
                if not line_str or not line_str.startswith("data:"):
                    continue
                data_str = line_str[5:].strip()
                if data_str == "[DONE]":
                    break

                try:
                    chunk = json.loads(data_str)
                except Exception:
                    continue

                choices = chunk.get("choices") or []
                if not choices:
                    continue
                token = (choices[0].get("delta") or {}).get("content") or ""
                if not token:
                    continue

                if not meta_sent:
                    meta_event = {
                        "type": "meta",
                        "intent": intent,
                        "sources": sanitize_sources(retrieved_chunks),
                        "provider": f"考亭理学书院 · 智谱清言 {self.llm_model}",
                        "session_id": session_id,
                        "user_name": sess.get("user_name"),
                        "fallback": False,
                    }
                    yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"
                    meta_sent = True

                safe_out = sanitizer.feed(token)
                if safe_out:
                    has_yielded_tokens = True
                    yield f"data: {json.dumps({'type': 'token', 'content': safe_out}, ensure_ascii=False)}\n\n"

            # 刷新流式净化器残余缓冲
            tail = sanitizer.flush()
            if tail:
                if not meta_sent:
                    meta_event = {
                        "type": "meta",
                        "intent": intent,
                        "sources": sanitize_sources(retrieved_chunks),
                        "provider": f"考亭理学书院 · 智谱清言 {self.llm_model}",
                        "session_id": session_id,
                        "user_name": sess.get("user_name"),
                        "fallback": False,
                    }
                    yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"
                    meta_sent = True
                has_yielded_tokens = True
                yield f"data: {json.dumps({'type': 'token', 'content': tail}, ensure_ascii=False)}\n\n"

            if not has_yielded_tokens and not self.is_session_stopped(session_id):
                raise RuntimeError("上游流式接口未返回有效内容")

            raw_full = sanitizer.full_text
            if mode == "qa" and not self.is_session_stopped(session_id):
                last_window = raw_full[-120:] if len(raw_full) >= 120 else raw_full
                if not any(q in last_window for q in ("？", "?")):
                    socratic_q = "\n\n老夫且掩卷设问以验贤生：仁兄体味此节要义，若落在汝自家日用身心之中，当从何处切己下手？"
                    raw_full += socratic_q
                    yield f"data: {json.dumps({'type': 'token', 'content': socratic_q}, ensure_ascii=False)}\n\n"

                if not any(k in raw_full for k in ("【参考资料】", "典籍原典出处", "考亭典籍出处")):
                    source_cite = generate_library_provenance_block(query, retrieved_chunks)
                    raw_full += source_cite
                    yield f"data: {json.dumps({'type': 'token', 'content': source_cite}, ensure_ascii=False)}\n\n"

            if raw_full.strip():
                session_manager.record_turn(session_id, query, raw_full)

            yield f"data: {json.dumps({'type': 'done', 'stopped': self.is_session_stopped(session_id)}, ensure_ascii=False)}\n\n"

        except GeneratorExit:
            pass
        except Exception as e:
            if has_yielded_tokens:
                # 中途断流：绝不再拼贴第二套兜底答案，优雅收尾并提示前端
                print(f"[Agent Stream] GLM 中途断流 ({session_id}): {e}")
                partial = sanitizer.flush()
                if partial:
                    yield f"data: {json.dumps({'type': 'token', 'content': partial}, ensure_ascii=False)}\n\n"
                if sanitizer.full_text.strip():
                    session_manager.record_turn(session_id, query, sanitizer.full_text)
                yield f"data: {json.dumps({'type': 'error', 'message': '云端传信中途微恙，已为您保留当前讲授内容。'}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'interrupted': True}, ensure_ascii=False)}\n\n"
            else:
                # 尚未输出任何 token，上抛给 chat_stream 触发无缝降级
                raise

    # ==========================================
    # 7. 文档与古籍图像深度识读剖析（带降级标识）
    # ==========================================

    def analyze_document_with_glm(self, filename: str, text_content: str) -> Tuple[str, bool]:
        """调用智谱大模型对上传的文献进行四维理学深度剖析；返回 (分析正文, is_fallback)"""
        sample_text = (text_content or "")[:3200].strip()
        if self.api_key and sample_text:
            try:
                endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
                system_prompt = (
                    "你乃宋代理学大儒考亭先生，纯第一人称老夫自述。面对后学呈上的文献，请紧扣原文内容从理学四维深入条分缕析：\n"
                    "一、📜 **【卷首提要 · 理气之辨】**：概括文献核心内容，剖析其中事理与气机；\n"
                    "二、🏮 **【存养省察 · 心性体认】**：指点学者如何以此照检身心、主敬涵养；\n"
                    "三、💡 **【格物致知 · 义理精析】**：紧扣原文具体片段字求其训、句索其旨；\n"
                    "四、🎯 **【知行相须 · 考亭朱砂手批】**：赐下切实践履指南与精辟朱批。\n"
                    "自称一律用老夫或某，语气庄重温厚。"
                )
                user_msg = (
                    f"门生谨呈文献《{filename}》，原典摘录如下：\n"
                    f"```text\n{sample_text}\n```\n\n"
                    f"请先生即物穷理，依理学四维深入条分缕析并赐朱砂手批。"
                )
                payload = {
                    "model": self.llm_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500,
                }
                resp_json = self._post_json(endpoint, payload, timeout=30.0)
                choices = resp_json.get("choices") or []
                ans = ((choices[0].get("message", {}).get("content") or "") if choices else "").strip()
                if ans:
                    return sanitize_zhuxi_first_person(ans), False
            except Exception as e:
                print(f"[Agent] GLM 文献分析遇阻，启用内生备用剖析引擎: {e}")

        clean_name = re.sub(r'\.(txt|md|docx|pdf)$', '', filename or '所呈文献', flags=re.IGNORECASE)
        excerpt = sample_text[:120].replace("\n", " ") if sample_text else ""
        excerpt_line = f"> 原文节录：“{excerpt}……”\n\n" if excerpt else ""
        fallback_ans = (
            f"老夫展卷披阅贤生所呈《{clean_name}》，用志甚笃，深可嘉许。当前云端识读通道暂忙，老夫先依考亭四维工夫为汝提纲挈领：\n\n"
            f"{excerpt_line}"
            f"### 一、 理气之辨\n"
            f"天下未有无理之气，亦未有无气之理。览此《{clean_name}》，当先辨析何者为恒常不变之根本义理，何者为随境流转之表象形迹。\n\n"
            f"### 二、 存养省察\n"
            f"为学之基全在敬字。研读此文须屏除客尘、虚心涵泳，切忌走马观花，而当字字反照自家心性。\n\n"
            f"### 三、 格物致知\n"
            f"于文中关键义理窒碍处着紧用力，字求其训、句索其旨，逐段穷格，积久自能豁然贯通。\n\n"
            f"### 四、 知行相须 · 考亭朱砂手批\n"
            f"大本已见端倪，万不可滞于纸墨空谈。请依循序渐进、熟读精思法门温省践履，亦可在答疑栏中就其中某一段落继续向老夫垂询！"
        )
        return fallback_ans, True

    def analyze_image_with_glm(self, content_bytes: bytes, mime_type: str = "image/jpeg") -> Tuple[str, bool]:
        """调用智谱 GLM-4v-flash 视觉大模型识读古籍图画；返回 (分析正文, is_fallback)"""
        b64_str = base64.b64encode(content_bytes).decode("utf-8")
        if self.api_key:
            try:
                endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
                system_prompt = (
                    "你乃宋代理学大儒考亭先生，纯第一人称老夫自述。请如实辨识画面中的文字、古籍书影、书法墨宝、诗词碑刻或山水景物，"
                    "切勿凭空捏造图中不存在的内容；而后结合格物穷理与武夷诗性哲学深入解构剖析并赐朱砂手批。"
                )
                user_content = [
                    {"type": "text", "text": "门生呈递图像一帧，请考亭先生如实识读图中内容，并依理学精微与诗性哲学剖析赐批。"},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_str}"}},
                ]
                payload = {
                    "model": self.vision_model or "glm-4v-flash",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1200,
                }
                resp_json = self._post_json(endpoint, payload, timeout=35.0)
                choices = resp_json.get("choices") or []
                ans = ((choices[0].get("message", {}).get("content") or "") if choices else "").strip()
                if ans:
                    return sanitize_zhuxi_first_person(ans), False
            except Exception as e:
                print(f"[Agent] GLM 视觉图像识读遇阻: {e}")

        fallback_ans = (
            "老夫已收悉贤生所呈图画墨宝，然此刻云端视觉识图接口暂未连通，老夫不敢凭空臆断图中字画细节（先圣有云：知之为知之，不知为不知）。\n\n"
            "💡 **【请益建议】**：\n"
            "贤生可稍后再试上传，或直接将图中的诗句、碑文、书影文字键入下方对话框，老夫定当为仁兄字求其训、句索其旨，详加朱砂手批！"
        )
        return fallback_ans, True

    # ==========================================
    # 8. 离线自适应认知推理引擎（高保真兜底，修复全部路由碰撞与死分支）
    # ==========================================

    def _resolve_contextual_query(self, query: str, session: Dict[str, Any]) -> Tuple[str, Optional[str]]:
        q = query.strip()
        if any(w in q for w in ("记得我叫", "我叫什么", "我的名字", "我是谁", "还记得我吗", "记得我么", "知我是谁")):
            if session.get("user_name"):
                return q, f"RECALL_NAME:{session['user_name']}"
            return q, "RECALL_NAME_UNKNOWN"

        if any(w in q for w in ("刚才聊了什么", "刚才说了什么", "前面问了什么", "上一个问题", "之前的话题", "刚才在聊什么", "刚才在讨论什么")):
            prev_q = session.get("prev_question")
            if not prev_q and session.get("history"):
                for h in reversed(session["history"]):
                    if h.get("role") == "user" and h.get("content") != q:
                        prev_q = h.get("content")
                        break
            if prev_q:
                return q, f"RECALL_LAST_TOPIC:{prev_q}"
            return q, "RECALL_TOPIC_FRESH"

        return q, None

    def _generate_intelligent_response(
        self,
        query: str,
        session_id: str,
        retrieved_chunks: List[Dict[str, Any]],
        mode: str = "qa",
    ) -> str:
        """离线/降级认知引擎：清晰路由、零碰撞、真实 OPAC 索书号、支持讲筵专模"""
        sess = session_manager.get_or_create(session_id)
        _, context_hint = self._resolve_contextual_query(query, sess)
        user_name = sess.get("user_name")
        salutation = f"诸生{user_name}" if user_name else "诸生"
        q_lower = query.lower().strip()
        q_clean = re.sub(r'[？?！!。，,\s]+', '', q_lower)

        # 讲筵模式专用离线简答（无 Markdown 标题、附带规范 [板书]）
        if mode == "galgame":
            quote_snip = ""
            if retrieved_chunks:
                raw_c = retrieved_chunks[0].get("content", "").replace("\n", " ").strip()
                sents = [s.strip() for s in re.split(r'[。！？]', raw_c) if len(s.strip()) > 10]
                if sents:
                    quote_snip = sents[0][:55]
            if quote_snip:
                return f"善哉！仁兄当堂发问，切中肯綮。先贤经传有云：“{quote_snip}。”为学贵在字求其训、切己体察，学者当收敛身心、主敬涵养，于日用常行处细细印证，方不负此一番问难。\n[板书] 即物穷理 居敬存诚"
            return "善哉！仁兄此问颇见思索之功。夫天下万事万物莫不有理，学者读书明道，须先定其志向，主敬以直内，循序渐进，切不可急躁求速，当于日用常行中切己体察。\n[板书] 循序渐进 切己体察"

        # 1. 自省致歉分支
        if any(k in q_lower for k in ("牛头不对马嘴", "答非所问", "驴唇不对马嘴", "胡说八道", "瞎扯", "太死板", "复读机", "回答不对", "一点都不智能")):
            return (
                f"{salutation}教训得极是！老夫方才迂腐之气发作，未能深切体察仁兄本意，实在惭愧！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《论语集注》云：“子路人告之以有过，则喜。知耻近乎勇，过则勿惮改。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "真正的学者最忌讳强不知以为知。仁兄直言指出疏漏，老夫当反身自省、闻过则改。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "请仁兄将心中最关切的经义疑难或治学困惑直言道来，老夫定当就事论事与仁兄真诚切磋！"
            )

        # 2. 记忆回溯分支（修复 split(":", 1) 避免截断含冒号的问句）
        if context_hint and context_hint.startswith("RECALL_NAME:"):
            name = context_hint.split(":", 1)[1]
            return (
                f"{salutation}请了！诸生方才自报姓名是【{name}】，老夫历历在心，何曾相忘？\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《白鹿洞书院揭示》首立人伦：“朋友有信。言忠信，行笃敬。”\n\n"
                f"不知{name}仁兄此刻又有何经书章句或修学疑难欲与老夫探讨？"
            )
        if context_hint == "RECALL_NAME_UNKNOWN":
            return (
                "后生学者请了！诸生尚未向老夫通报过尊姓大名呢。\n\n"
                "古者学子入考亭书院，先正名分。未知仁兄尊姓大名、表字如何？不妨告知老夫（如言“我叫某某”），往后便以表字相称！"
            )
        if context_hint and context_hint.startswith("RECALL_LAST_TOPIC:"):
            last_q = context_hint.split(":", 1)[1]
            return (
                f"{salutation}方才与老夫论及“{last_q}”一事，老夫犹在回味之中。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《论语集注》云：“温故而知新，可以为师矣。温，寻温也，谓数数寻温之。”\n\n"
                "方才探讨之理尚未冷却，不知仁兄对此可又推衍出新的疑窦？"
            )

        # 3. 显式论文专修步骤（必须含“论文专修”或“步骤一~六”或“换一批”，不再劫持普通理学提问）
        is_explicit_thesis = any(k in query for k in ("【论文专修", "步骤一", "步骤二", "步骤三", "步骤四", "步骤五", "步骤六", "换一批特藏", "换一批文献", "换一批典籍"))
        if is_explicit_thesis:
            active_topic = sess.get("thesis_topic") or "朱子理学核心范畴与特藏文献研析"
            if any(k in query for k in ("换一批特藏", "换一批文献", "换一批典籍")):
                batches = [
                    (
                        "第一批核心原典",
                        "1. **《朱子语类》**（宋·黎靖德编）· 索书号：`B244.71/L42`（特藏室·宋明理学专柜）\n"
                        "2. **《四书章句集注》**（宋·朱熹著）· 索书号：`B222.12/Z90:10`（总馆·流通书库）\n"
                        "3. **《晦庵先生朱文公文集》**（宋·朱熹撰）· 索书号：`B244.72/Z90`（特藏库）"
                    ),
                    (
                        "第二批理学经典",
                        "1. **《近思录》**（宋·朱熹、吕祖谦编）· 索书号：`B244.74/Z30`（总馆·流通书库）\n"
                        "2. **《周易本义》**（宋·朱熹著）· 索书号：`B221.5/L30`（总馆·流通书库）\n"
                        "3. **《太极图说解》**（宋·朱熹著）· 索书号：`B244.25/Z29`（总馆·流通书库）"
                    ),
                    (
                        "第三批武夷特色馆藏专著",
                        "1. **《世纪之交的朱子学》**（徐公喜主编）· 索书号：`B244.75/X39:2`（总馆·流通书库/特藏库）\n"
                        "2. **《第二届考亭论坛专辑》**（武夷学院朱子学研究中心编）· 索书号：`B244.75/L43:1`（总馆·流通书库）\n"
                        "3. **《朱子文化在海外》**（戴健编著）· 索书号：`B244.75/D40`（总馆·流通书库）"
                    ),
                ]
                idx = sess.get("thesis_batch_idx", 0) % len(batches)
                sess["thesis_batch_idx"] = (idx + 1) % len(batches)
                b_name, b_list = batches[idx]
                return (
                    f"{salutation}遵贤生雅意，老夫已从武夷学院逸夫图书馆为您调阅**【{b_name}】**（围绕论题：{active_topic}）：\n\n"
                    f"{b_list}\n\n"
                    "文献既已丰盈，仁兄可点击下方步骤胶囊继续推进精研，或就其中任意一部典籍向老夫追问！"
                )
            if "步骤六" in query:
                return (
                    f"{salutation}历经五步磨砺，围绕**【{active_topic}】**的论文雏形大备！现开启**【步骤六 · 毕业答辩模拟质询与开题总纲】**：\n\n"
                    "🎓 **【三大答辩模拟质询】**：\n"
                    f"1. **本体与问题意识追问**：围绕“{active_topic}”，你的核心立论与既有学界共识相比，最具穿透力的突破点何在？\n"
                    "2. **文献版本与实证追问**：文中征引的《朱子语类》与《四书章句集注》是否区分了早年“中和旧说”与晚年定论？\n"
                    "3. **当代转化价值追问**：此一宋代理学命题如何回应现代社会或青年学子的真实困境，而非止步于史料复述？\n\n"
                    "📜 **【考亭开题评审寄语】**：选题端正，扎根武夷学院逸夫图书馆特藏文献，逻辑清晰，**准予开题**！仁兄对上述哪一问欲先试答？"
                )
            if "步骤五" in query:
                return (
                    f"{salutation}四章节骨架既立，围绕**【{active_topic}】**进入**【步骤五 · 学术前沿创新点与文献综述撰拟】**：\n\n"
                    "🔬 **【三大创新点提炼方向】**：\n"
                    "1. **馆藏文献对勘创新**：立足武夷学院自建宋明理学特色库与《闽北文库》，以第一手原典对勘后世误解；\n"
                    "2. **哲学范式阐释创新**：避免简单套用西方二元框架，回归宋代“理气—心性—工夫”有机整体视角；\n"
                    "3. **当代实践转化创新**：对接当代身心涵养、高校书院教育或跨文明对话。\n\n"
                    "📚 **【必读学术谱系】**：陈来《朱子哲学研究》、钱穆《朱子新学案》、蒙培元《理学范畴系统》。\n\n"
                    "仁兄可继续推进至【步骤六：模拟答辩质询】，或让老夫针对本选题细化某一条综述评述！"
                )
            if "步骤四" in query:
                return (
                    f"{salutation}围绕**【{active_topic}】**进入**【步骤四 · 四章节论证细纲与分章写作要领】**：\n\n"
                    "📖 **第一章：问题缘起与学术史综述**（研究背景、宋明清至现当代流变、核心文献版本说明）\n"
                    "📖 **第二章：核心概念训诂与原典脉络**（字义疏证、经典章句对勘、内在机理剖析）\n"
                    "📖 **第三章：核心论点推演与学术争鸣回应**（分点论证、回应清代考据学或心学质疑、体用贯通）\n"
                    "📖 **第四章：当代价值转化与结语**（现代启示、考亭文脉现实观照、研究展望）\n\n"
                    "仁兄可推进至【步骤五：创新点与文献综述】，或直接把某一章草稿发给老夫润色批改！"
                )
            if "步骤三" in query:
                return (
                    f"{salutation}围绕**【{active_topic}】**进入**【步骤三 · 核心哲学范畴辩证与学术争鸣】**：\n\n"
                    "⚖️ **【论文必辨之三大交锋】**：\n"
                    "1. **本体与现象之辨**：厘清“理不离气、亦不杂气”的逻辑在先性，回应清儒戴震“分理气为二”之批评；\n"
                    "2. **尊德性与道问学之辨**：梳理朱陆鹅湖之会分歧，说明外格物理与内明本心如何相资互发；\n"
                    "3. **知行先后轻重之辨**：对比朱子“论先后知为先，论轻重行为重”与阳明“知行合一”。\n\n"
                    "三阶辩难既通，仁兄可点击推进至【步骤四：四章节论证细纲】！"
                )
            if "步骤二" in query:
                return (
                    f"{salutation}围绕**【{active_topic}】**进入**【步骤二 · 特藏文献精研与核心文句考证】**：\n\n"
                    "📜 **【三大核心原典考释示范】**：\n"
                    "1. **《朱子语类》卷一**（索书号：`B244.71/L42`）：“未有天地之先，毕竟也只是理。”——“毕竟”二字直指逻辑本原。\n"
                    "2. **《四书章句集注·大学章句》**（索书号：`B222.12/Z90：1`）：“即凡天下之物，莫不因其已知之理而益穷之。”——格为至，穷为推极。\n"
                    "3. **《晦庵先生朱文公文集》**（索书号：`B244.72/Z90`）：“理不离气，亦不杂气。”——防认气为理之弊。\n\n"
                    "原典考证已明，请推进至【步骤三：核心范畴辩证与学术争鸣】！"
                )
            # 步骤一
            return (
                f"{salutation}选定**【{active_topic}】**为论题，立意高迈！现开启**【步骤一 · 选题破题与文献定位】**：\n\n"
                "🎯 **一、【破题立意与问题意识】**：\n"
                f"• 立足武夷学院逸夫图书馆自建宋明理学特藏，紧扣“{active_topic}”厘清原典脉络、回应学术史分歧，并阐发当代转化价值。\n\n"
                "📚 **二、【推荐核心馆藏书目】**：\n"
                "1. **《四书章句集注》** · 索书号：`B222.12/Z90:10`（总馆 - 流通书库）\n"
                "2. **《朱子语类》** · 索书号：`B244.71/L42`（总馆 - 特藏库）\n"
                "3. **《近思录》** · 索书号：`B244.74/Z30`（总馆 - 流通书库）\n\n"
                "💡 **【循序进道】**：请点击下方【步骤二：特藏文献精研与文句考证】，或点击【更换一批特藏文献】拓展书目！"
            )

        # 4. 朱子生平六阶段（细化条件，绝不误伤普通“白鹿洞学规”或“存养”提问）
        if any(k in q_lower for k in ("幼承庭训", "从师游学", "幼年", "朱松")):
            return (
                "追忆【幼承庭训与从师游学】，老夫生于南宋建炎四年福建尤溪。幼承先父韦斋公庭训，十四岁奉母迁居崇安五夫里，从胡宪、刘勉之、刘子翚三先生受学，奠定一生志道根基。\n\n"
                "贤生于老夫早年立志求学之事，可有何体悟或疑问？"
            )
        if any(k in q_lower for k in ("延平师事", "弃佛归儒", "李侗")):
            return (
                "提及【延平师事与弃佛归儒】，此乃老夫学术生命之重大转折！早岁曾出入佛老，二十四岁赴延平师从李侗先生，先生教老夫于日用人伦细微处体认天理，遂豁然归宗二程洛学正脉。\n\n"
                "仁兄对老夫由博返约、弃禅归儒之心路历程，可有何思索？"
            )
        if any(k in q_lower for k in ("结庐武夷", "撰集四书")):
            return (
                "淳熙十年老夫筑【武夷精舍】于隐屏峰下，聚徒讲道，倾毕生心血成《四书章句集注》，以《大学》《论语》《孟子》《中庸》为入德阶梯，成为万世经学定本。\n\n"
                "贤生于《四书》次第与精舍讲学之风，欲先问哪一端？"
            )
        if any(k in q_lower for k in ("鹅湖之会", "朱陆论辩", "陆九渊")):
            return (
                "淳熙二年【鹅湖之会】乃宋代理学盛事！老夫主“道问学”以格物致知，陆子静主“尊德性”以发明本心。君子和而不同，二者本如车之两轮，当相资并进、不可偏废。\n\n"
                "仁兄以为今日治学，尊德性与道问学当如何兼顾？"
            )
        if any(k in q_lower for k in ("知南康军", "复兴白鹿洞")):
            return (
                "淳熙六年老夫知南康军，荒年赈济之余，寻访庐山五老峰下废墟，重修【白鹿洞书院】并手订《白鹿洞书院揭示》，立五教、为学、修身、处事、接物五纲，明示读书非为干禄而在明伦。\n\n"
                "仁兄对老夫兴复书院、立范垂训之旨，可有何启发？"
            )
        if any(k in q_lower for k in ("晚年考亭", "庆元党禁", "伪学")):
            return (
                "绍熙三年老夫定居建阳考亭，建沧洲精舍。庆元二年权臣韩侂胄兴【庆元党禁】，斥理学为“伪学”。危难当前，老夫日日讲学不辍，笑言“道在天地，岂一纸文告所能夺”，直至病笃犹手订《大学·诚意章》。\n\n"
                "贤生对士人临大节而不可夺之风骨，心中可有感慨？"
            )

        # 5. 读书六法（具体条文优先于总览！）
        if "循序渐进" in q_lower or "小立课程" in q_lower:
            return (
                f"{salutation}问及读书法第一条**【循序渐进】**，此乃专治浮躁贪快之良药！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》中谆谆戒曰：“小立课程，微加积叠。字求其训，句索其旨。未得乎前，不敢求乎后；未通乎上，不敢求乎下。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "每天定下实实在在的小篇幅，把眼前这一段字义脉络啃透，再去翻下一页，远胜于同时翻几本书却走马观花。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "仁兄今日不妨只定一页精读目标，切实吃透，可愿一试？"
            )
        if "熟读精思" in q_lower:
            return (
                f"{salutation}问及**【熟读精思】**，此乃读书由浅入深之关窍！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫示门生：“须读得烂熟，使得其言尽若出于吾之口；继以精思，使其意尽若出于吾之心。先须无疑，次须有疑，次须无疑，方始是学。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "先出声朗诵至烂熟于胸，再掩卷反复追问其所以然，从不疑到生疑再到释疑，方化为自家真知。"
            )
        if "虚心涵泳" in q_lower:
            return (
                f"{salutation}叩问**【虚心涵泳】**，此乃体认圣贤本意之神妙处！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫尝喻：“读书须如白纸受墨，扫荡胸中宿见私意，只虚心看圣人如何说。涵者如水浸之，泳者如人在水底游也。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "先放下主观成见，平心静气浸润于文本之中，反复玩味，圣贤微旨自然浮现。"
            )
        if "切己体察" in q_lower or "反求诸己" in q_lower:
            return (
                f"{salutation}问及**【切己体察】**，此乃读书与修身合一的枢纽！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《四书章句集注》云：“古之学者为己，今之学者为人。”读圣贤书当以其言照检自家身心，而非徒作谈资。\n\n"
                "💡 **【现代白话精析】**：\n"
                "把书中每一句义理都当成照检自身行为的明镜，在日用待人接物中落地践履。"
            )
        if "着紧用力" in q_lower or "上水船" in q_lower:
            return (
                f"{salutation}问及**【着紧用力】**，此乃克治拖延懈怠之法门！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫尝诫：“为学正如撑上水船，一篙不可放缓！宽着期限，紧着日程。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "长远目标可以宽放期限，但今日功课必须紧抓不放，切莫明日复明日。"
            )
        if "居敬持志" in q_lower or "主一无适" in q_lower:
            return (
                f"{salutation}叩问**【居敬持志】**，此乃统摄全部治学工夫之主宰！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 程子言：“涵养须用敬，进学在致知。”老夫定解曰：“敬字工夫，只是主一无适，整齐严肃。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "外整衣冠书案，内敛心神专一不分心，常存向上之志，则万般杂念无从扰乱。"
            )
        if any(k in q_lower for k in ("读书法", "六条", "六步", "六法", "读书之道")):
            return (
                f"{salutation}叩问老夫生平所订**【朱子读书法六条】**：\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 门人辑老夫读书遗训为六法：一曰循序渐进，二曰熟读精思，三曰虚心涵泳，四曰切己体察，五曰着紧用力，六曰居敬持志。\n\n"
                "💡 **【现代白话精析】**：\n"
                "1. **循序渐进**：小立课程、不贪多躐等；\n"
                "2. **熟读精思**：读至烂熟、掩卷深思；\n"
                "3. **虚心涵泳**：放下偏见、沉潜体味；\n"
                "4. **切己体察**：反照自身、知行合一；\n"
                "5. **着紧用力**：如撑上水船、今日事今日毕；\n"
                "6. **居敬持志**：端坐专注、立定远志。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "仁兄平日读书，觉这六法之中哪一条最切合当下之需？"
            )

        # 6. 核心理学范畴（格物致知、理一分殊、理气、存天理灭人欲、心统性情、知行、白鹿洞学规）
        if "白鹿洞" in q_lower or "书院学规" in q_lower or "揭示" in q_lower:
            return (
                f"{salutation}询及**【白鹿洞书院揭示】**，此乃老夫手订之书院宪章！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 五教之目：父子有亲，君臣有义，夫妇有别，长幼有序，朋友有信。\n"
                "> 为学之序：博学之，审问之，慎思之，明辨之，笃行之。\n"
                "> 修身之要：言忠信，行笃敬；惩忿窒欲，迁善改过。\n"
                "> 处事之要：正其义不谋其利，明其道不计其功。\n"
                "> 接物之要：己所不欲，勿施于人；行有不得，反求诸己。\n\n"
                "💡 **【现代白话精析】**：\n"
                "修身贵在诚敬克己、闻过则改；处事重义轻利；接物推己及人、遇阻先自省。"
            )
        if "格物致知" in q_lower or "即物穷理" in q_lower:
            return (
                f"{salutation}叩问理学根基**【格物致知】**！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《大学章句·补格物致知传》定论：“所谓致知在格物者，言欲致吾之知，在即物而穷其理也……至于用力之久，而一旦豁然贯通焉，则众物之表里精粗无不到，而吾心之全体大用无不明矣。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "不凭空臆断，脚踏实地就眼前一件件事物穷究其必然规律，积习既久，终能豁然贯通。"
            )
        if "理一分殊" in q_lower or "月印万川" in q_lower:
            return (
                f"{salutation}问及本体奥妙**【理一分殊】**！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《朱子语类》云：“理一分殊，本只是一太极，而万物各有其太极。如月在天，只一而已；及散在江湖，则随处而见，不可谓月已分也。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "宇宙根本公理浑然一体（理一），落实到具体人伦万物又各具分寸秩序（分殊），恰似天上一轮明月映照千江万水。"
            )
        if "理气" in q_lower or "理在气先" in q_lower or "气在先" in q_lower:
            return (
                f"{salutation}叩问**【理气不离不杂】**之奥义！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫示门生：“天下未有无理之气，亦未有无气之理。理也者，形而上之道也；气也者，形而下之器也。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "理是法则秩序，气是质料形器；二者现实中永不分离（不离），本质上又界限分明（不杂）；所谓理在气先，是逻辑本原在先，非时间先后。"
            )
        if "存天理" in q_lower or "灭人欲" in q_lower or "以理杀人" in q_lower:
            return (
                f"{salutation}论及**【存天理，灭人欲】**，老夫正当辨明千古误解！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》明辨：“饮食，天理也；要求美味贪索无度，人欲也。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "正当合理的衣食人伦本是天理；老夫所戒除的“人欲”，乃违背公义、损人利己的过度贪妄。后世清儒戴震痛斥流俗借名教压人之弊，实非老夫“天地生物之心”本旨！"
            )
        if "心统性情" in q_lower or "未发已发" in q_lower or "性即理" in q_lower:
            return (
                f"{salutation}问及**【心统性情】**之旨！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫注《中庸》曰：“心统性情者也。性是体，静而未发之理；情是用，感物已发之端。心兼体用，为主宰。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "未发时主敬涵养善性，已发时省察节制情绪，使喜怒哀乐发而皆中节。"
            )
        if "知行" in q_lower:
            return (
                f"{salutation}叩问**【知行先后与轻重】**！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫明断：“知行常相须，如目无足不行，足无目不见。论先后，知为先；论轻重，行为重！”\n\n"
                "💡 **【现代白话精析】**：\n"
                "先读书明理认清路向，再躬行践履落到实处；知之愈明则行之愈笃，行之愈笃则知之益明。"
            )

        # 7. 情绪疏导（疲惫、浮躁、读不进去）
        if any(k in q_lower for k in ("好累", "不想学", "累了", "学不进去", "读不进去", "厌学", "摸鱼", "摆烂", "躺平", "心累", "好烦", "浮躁", "静不下心", "焦虑", "走神", "杂念")):
            return (
                f"{salutation}且请宽坐，莫要苛责自己！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》中尝诫门人：“体倦则心怠，心怠则理不入。半日静坐，半日读书。读书不可贪多，宽着期限，紧着日程。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "身心疲惫或浮躁之时硬撑苦读，反倒事倍功半。不妨暂合书卷，整肃坐姿、闭目调息或散步半刻，待心火平息后，依“循序渐进、熟读精思”之法只攻一小段功课。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "仁兄此刻最困扰心神的是课业太重，还是杂念纷扰？不妨说与老夫听听。"
            )

        # 8. 推荐书目、作诗、自我介绍、寒暄、生平
        if any(k in q_lower for k in ("推荐一本书", "推荐书", "看什么书", "读什么书", "从哪本开始", "先读什么")):
            return (
                "若问初学首推何书，老夫必首荐**《大学》**！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《大学章句序》云：“先读《大学》以定其规模，次读《论语》以立其根本，次读《孟子》以观其发越，次读《中庸》以极夫精微。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "《大学》篇幅凝练却立下三纲领、八条目大骨架，读通《大学》再入《论》《孟》《中庸》，自能循序渐进。"
            )
        if any(k in q_lower for k in ("写首诗", "作首诗", "念首诗", "观书有感", "半亩方塘")):
            return (
                "哈哈，后生问及诗作！老夫当年居五夫紫阳楼，偶有所感赋《观书有感·其一》：\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> **半亩方塘一鉴开，天光云影共徘徊。**\n"
                "> **问渠那得清如许？为有源头活水来。**\n\n"
                "💡 **【现代白话精析】**：\n"
                "人心如一池方塘，惟有不断读书明理、引来源头活水，方能永葆虚明澄澈。"
            )
        if any(k in q_lower for k in ("你是谁", "你是哪位", "尊姓大名", "介绍你自己", "你叫什么", "你的生平")):
            return (
                "后生学者请了！老夫字元晦，号晦庵，晚号考亭先生、沧洲病叟，南宋人，生于福建尤溪，祖籍徽州婺源。\n\n"
                "老夫毕生聚徒武夷精舍、考亭书院与白鹿洞书院，注定《四书章句集注》，集宋代理学之大成。今日得与诸生在此论道，实乃雅缘！"
            )
        if any(k in q_lower for k in ("朝代", "多大", "几岁", "出生", "籍贯", "哪里人", "老家")):
            return (
                "老夫乃南宋人，高宗建炎四年（公元1130年）生于福建尤溪，祖籍徽州婺源，寿七十有一，历经高、孝、光、宁四朝，晚年定居建阳考亭讲学。"
            )
        if any(k in q_lower for k in ("吃了吗", "吃饭了吗", "天气")):
            return (
                f"{salutation}有心挂念！老夫在考亭精舍清茶淡饭，起居简朴，窗外武夷云水清旷，正宜静坐读书。仁兄今日起居可还安泰？"
            )
        if _extract_user_name(query) and len(q_clean) <= 10:
            nm = _extract_user_name(query)
            return (
                f"原来是【{nm}】仁兄！今日幸会考亭书院，老夫有礼了！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《论语集注》云：“有朋自远方来，不亦乐乎？”\n\n"
                f"不知{nm}仁兄今日有何经义或治学心得愿与老夫相叙？"
            )
        if any(k in q_lower for k in ("你好", "您好", "在吗", "先生好", "请了", "早上好", "下午好", "晚上好", "hello", "hi")) and len(q_clean) <= 12:
            return (
                "仁兄请了！老夫在此拱手有礼。今日考亭精舍清风徐来，不知仁兄造访，是有经传疑义要与老夫剖析，还是在读书修身之中遇有困惑？但请直道！"
            )
        if q_clean in ("可以", "好", "好的", "是", "对", "行", "愿闻其详", "受教", "受教了"):
            return (
                "善哉！仁兄有此向道精进之心，老夫深感欣慰。我们不妨就手头一部经典或一件日用实事切近研磨，仁兄欲先从何处谈起？"
            )

        # 9. 纯四则算术（严格锚定整句，彻底杜绝把索书号 B244.7/12 算成 0.58！）
        calc_match = re.fullmatch(r'\s*(\d+)\s*([\+\-\*\/]|加|减|乘|除)\s*(\d+)\s*[=等于？?吗]*\s*', query.strip())
        if calc_match:
            n1, op, n2 = int(calc_match.group(1)), calc_match.group(2), int(calc_match.group(3))
            res = None
            if op in ("+", "加"):
                res = n1 + n2
            elif op in ("-", "减"):
                res = n1 - n2
            elif op in ("*", "乘"):
                res = n1 * n2
            elif op in ("/", "除") and n2 != 0:
                res = n1 // n2 if n1 % n2 == 0 else round(n1 / n2, 2)
            if res is not None:
                return (
                    f"仁兄以数算相询，依九九推步之术，此数当为【{res}】。\n\n"
                    "📜 **【考亭原典明训】**：\n"
                    "> 《周易本义》云：“数者，理之符也。天下之事，莫不有理，莫不有数。”"
                )

        # 10. 终极 RAG 循证兜底（严格取最高相关性 Top-1 切片，绝不随机 hash 错配）
        clean_focus = re.sub(r'[？?！!。，,\s]', '', query)
        if len(clean_focus) > 22:
            clean_focus = clean_focus[:22] + "……"

        best_source = "《四书章句集注》"
        rag_quote_block = "天下之事，莫不有理。即凡天下之物，莫不因其已知之理而益穷之。"
        if retrieved_chunks:
            top_chunk = retrieved_chunks[0]
            raw_src = top_chunk.get("source", "")
            matched_b, _ = match_book_record(raw_src, query)
            if matched_b and matched_b.get("stdTitle"):
                best_source = matched_b["stdTitle"]
            else:
                best_source = f"《{raw_src.replace('.txt', '').replace('.md', '').split('_')[0]}》"
            clean_c = re.sub(r'#{1,4}\s*[^\n]+\n?', '', top_chunk.get("content", "")).replace("\n", " ").strip()
            sents = [s.strip() for s in re.split(r'[。！？]', clean_c) if len(s.strip()) > 10]
            if sents:
                rag_quote_block = sents[0][:110]
            elif clean_c:
                rag_quote_block = clean_c[:110]

        return (
            f"{salutation}叩问“{clean_focus}”，老夫平心体味，特取本馆所藏原典明训与仁兄互证。\n\n"
            "📜 **【考亭原典明训】**：\n"
            f"> {best_source}有云：“{rag_quote_block}”\n\n"
            "💡 **【现代白话精析】**：\n"
            "古圣贤之学皆落于日用常行与事理秩序之中。面对此问，须先虚心涵泳、扫除成见，推求事物之本原规矩，再由知及行，一步步落实于身心践履。\n\n"
            "🎯 **【切己体察功夫】**：\n"
            "仁兄于此若尚有具体章句或现实处境欲细加剖判，不妨再向老夫细述！"
        )

    # ==========================================
    # 9. 对外统一问答入口（同步 + SSE 流式）
    # ==========================================

    def chat(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]] = None,
        session_id: str = "default",
        mode: Optional[str] = None,
        temperature: float = 0.72,
    ) -> Dict[str, Any]:
        """完整多轮上下文同步问答入口"""
        resolved_mode = self._infer_mode(session_id, mode)
        session_manager.update_with_query(session_id, query, history)
        sess = session_manager.get_or_create(session_id)
        retrieved_chunks = rag_service.search(query, top_k=4)

        if not is_grounded_query(query, retrieved_chunks, session=sess, mode=resolved_mode):
            reply_text = UNGROUNDED_REFUSAL
            session_manager.record_turn(session_id, query, reply_text)
            return {
                "reply": reply_text,
                "intent": "strict_grounded_refusal",
                "sources": [],
                "provider": "考亭理学书院 · 严格原典循证守则",
                "session_id": session_id,
                "user_name": sess.get("user_name"),
                "fallback": False,
            }

        # 自由问答与论文多步骤优先交由云端大模型结合上下文与 RAG 动态生成（仅“换一批文献”走本地确定性馆藏轮换）
        is_local_batch_switch = any(k in query for k in ("换一批特藏", "换一批典籍", "换一批文献"))
        if not is_local_batch_switch and self.api_key:
            try:
                res = self._call_glm(
                    query,
                    history,
                    session_id,
                    retrieved_chunks,
                    mode=resolved_mode,
                    temperature=temperature,
                )
                if res and res.get("reply"):
                    return res
            except Exception as e:
                print(f"[Agent] 智谱大模型未能成功响应，自动降级至本地认知引擎: {e}")

        # 离线/降级认知引擎
        reply_text = self._generate_intelligent_response(query, session_id, retrieved_chunks, mode=resolved_mode)
        reply_text = sanitize_zhuxi_first_person(reply_text)
        if resolved_mode == "qa":
            reply_text = ensure_socratic_question(reply_text, query)
            reply_text = inject_inline_citations(reply_text)
            if not any(k in reply_text for k in ("【参考资料】", "典籍原典出处", "考亭典籍出处")):
                reply_text += generate_library_provenance_block(query, retrieved_chunks)

        session_manager.record_turn(session_id, query, reply_text)
        return {
            "reply": reply_text,
            "intent": _classify_intent(query),
            "sources": sanitize_sources(retrieved_chunks),
            "provider": "考亭理学书院 · 考亭认知引擎",
            "session_id": session_id,
            "user_name": sess.get("user_name"),
            "fallback": bool(self.api_key and not is_local_batch_switch),
        }

    def chat_stream(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]] = None,
        session_id: str = "default",
        mode: Optional[str] = None,
        temperature: float = 0.72,
    ) -> Generator[str, None, None]:
        """SSE 流式实时推送生成器"""
        resolved_mode = self._infer_mode(session_id, mode)
        self.cleanup_stopped_session(session_id)
        session_manager.update_with_query(session_id, query, history)
        sess = session_manager.get_or_create(session_id)
        retrieved_chunks = rag_service.search(query, top_k=4)

        try:
            if not is_grounded_query(query, retrieved_chunks, session=sess, mode=resolved_mode):
                reply_text = UNGROUNDED_REFUSAL
                session_manager.record_turn(session_id, query, reply_text)
                meta_event = {
                    "type": "meta",
                    "intent": "strict_grounded_refusal",
                    "sources": [],
                    "provider": "考亭理学书院 · 严格原典循证守则",
                    "session_id": session_id,
                    "user_name": sess.get("user_name"),
                    "fallback": False,
                }
                yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"
                for i in range(0, len(reply_text), 6):
                    if self.is_session_stopped(session_id):
                        break
                    yield f"data: {json.dumps({'type': 'token', 'content': reply_text[i:i + 6]}, ensure_ascii=False)}\n\n"
                    time.sleep(0.01)
                yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
                return

            is_local_batch_switch = any(k in query for k in ("换一批特藏", "换一批典籍", "换一批文献"))
            fallback_triggered = False

            if not is_local_batch_switch and self.api_key:
                try:
                    for chunk in self._call_glm_stream(
                        query,
                        history,
                        session_id,
                        retrieved_chunks,
                        mode=resolved_mode,
                        temperature=temperature,
                    ):
                        yield chunk
                    return
                except Exception as e:
                    print(f"[Agent Stream] GLM 启动遇阻，自动降级至本地认知引擎: {e}")
                    fallback_triggered = True

            # 本地认知引擎平滑打字机推送
            reply_text = self._generate_intelligent_response(query, session_id, retrieved_chunks, mode=resolved_mode)
            reply_text = sanitize_zhuxi_first_person(reply_text)
            if resolved_mode == "qa":
                reply_text = ensure_socratic_question(reply_text, query)
                reply_text = inject_inline_citations(reply_text)
                if not any(k in reply_text for k in ("【参考资料】", "典籍原典出处", "考亭典籍出处")):
                    reply_text += generate_library_provenance_block(query, retrieved_chunks)

            session_manager.record_turn(session_id, query, reply_text)
            meta_event = {
                "type": "meta",
                "intent": _classify_intent(query),
                "sources": sanitize_sources(retrieved_chunks),
                "provider": "考亭理学书院 · 考亭认知引擎",
                "session_id": session_id,
                "user_name": sess.get("user_name"),
                "fallback": fallback_triggered,
            }
            yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"

            for i in range(0, len(reply_text), 6):
                if self.is_session_stopped(session_id):
                    break
                yield f"data: {json.dumps({'type': 'token', 'content': reply_text[i:i + 6]}, ensure_ascii=False)}\n\n"
                time.sleep(0.01)

            yield f"data: {json.dumps({'type': 'done', 'stopped': self.is_session_stopped(session_id)}, ensure_ascii=False)}\n\n"
        except GeneratorExit:
            print(f"[Agent Stream] 客户端断开连接: {session_id}")
        finally:
            self.cleanup_stopped_session(session_id)


zhuzi_agent = ZhuXiAgent()

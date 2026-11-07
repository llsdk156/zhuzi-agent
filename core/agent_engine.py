"""
朱子文化特色智能体 - 核心推理与多轮上下文记忆认知引擎 (Agent Engine)
100% 纯第一人称朱熹自述 · 古文原典与现代白话双璧交融 · 零门槛文化普及
支持多轮上下文记忆、学者身份记忆、本地 GPU 大模型极速驱动与内生高保真认知自适应推理。
"""

import os
import re
import json
import time
import base64
import urllib.request
import urllib.error
from typing import List, Dict, Any, Generator, Optional, Tuple
from rag.rag_service import rag_service
from core.prompt_templates import (
    ZHU_XI_SYSTEM_PROMPT,
    READING_METHOD_PROMPT,
    ACADEMY_RULES_PROMPT,
    TEXT_EXEGESIS_PROMPT,
    POETRY_APPRECIATION_PROMPT,
    PHILOSOPHICAL_DEBATE_PROMPT,
    ANCIENT_LETTER_PROMPT
)


def strip_parentheses(text: str) -> str:
    """彻底清除所有圆括号及其内部内容，绝不输出任何括号内容"""
    if not text:
        return ""
    t = text
    # 循环消除成对嵌套或多段中英文圆括号
    prev = None
    while prev != t:
        prev = t
        t = re.sub(r'[\(（][^()（）]*?[\)）]', '', t, flags=re.DOTALL)
    # 消除任何未闭合的括号至换行或文末
    t = re.sub(r'[\(（][^()（）\n]*', '', t)
    # 最终防御：彻底清除所有孤立的残余括号符号
    t = t.replace("(", "").replace(")", "").replace("（", "").replace("）", "")
    # 规整连续3个以上换行为2个换行，严禁调用 t.strip() 消除首尾换行，防止破坏流式拼接与段落格式
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t


def sanitize_zhuxi_first_person(text: str) -> str:
    """全面净化输出文本：
    1. 彻底清除对朱熹第三人称的描述，自称替换为大儒第一人称'老夫'或'考亭先生'
    2. 严格保护真实传世典籍书名（如《朱子语类》《朱子文集》《朱子家礼》《朱子全书》），严禁篡改书名
    3. 严格清除任何中英文圆括号
    """
    if not text:
        return ""
    # 1. 优先剔除所有括号及其内部文本
    t = strip_parentheses(text)

    # 2. 保护书名号《》内的所有真实典籍名称，以及特定机构和学术专有名词
    protected = []
    def _protect_repl(match):
        token = f"__PROT_BOOK_{len(protected)}__"
        protected.append(match.group(0))
        return token

    # 保护所有《...》书名
    t = re.sub(r'《[^》]+》', _protect_repl, t)

    # 保护专有名词
    proper_nouns = [
        "朱子文化", "朱子学", "朱子书院", "朱子学研究中心", "朱子特藏专柜", "朱子特藏",
        "朱子行教", "朱子像", "朱子故里", "武夷学院", "考亭书院", "紫阳楼", "建阳考亭",
        "朱子读书法", "朱子读书六法", "朱子全书", "朱子语类", "朱子文集", "朱子家训",
        "朱子理学", "朱子诗词", "朱子的诗和远方", "世纪之交的朱子学"
    ]
    for noun in proper_nouns:
        if noun in t:
            token = f"__PROT_NOUN_{len(protected)}__"
            protected.append(noun)
            t = t.replace(noun, token)

    # 3. 称谓前置替换
    t = re.sub(r'朱文公', '考亭先生', t)
    t = re.sub(r'朱夫子', '考亭先生', t)
    t = re.sub(r'朱老师|朱爷爷', '考亭先生', t)

    # 4. 修正偶发的多重错误表述
    t = re.sub(r'我乃(?:南宋理学家)?(?:朱熹|朱子|老夫)?之后学(?:中的一员)?', '老夫乃考亭先生', t)
    t = re.sub(r'我是(?:朱熹|朱子|老夫)之后学(?:中的一员)?', '老夫乃考亭先生', t)
    t = re.sub(r'老夫之后学中的一员', '考亭理学门人', t)

    # 5. 诗文与著述第三人称全面更正为作者第一人称
    t = re.sub(r'(?:作者|诗人)个人的生活经历(?:、思想感情)?', '老夫当年的修道求索与山水寄托', t)
    t = re.sub(r'作为武夷山所作的总篇', '作为老夫当年所作武夷山之总篇', t)
    t = re.sub(r'反映了(?:作者|诗人)', '体现了老夫当年', t)
    t = re.sub(r'体现了(?:作者|诗人)', '体现了老夫', t)
    t = re.sub(r'展现了(?:作者|诗人)', '展现了老夫当年', t)
    t = re.sub(r'表达了(?:作者|诗人)', '寄托了老夫', t)
    t = re.sub(r'展现了他对', '展现了老夫对', t)
    t = re.sub(r'体现了他对', '体现了老夫对', t)
    t = re.sub(r'他期望在', '老夫当年期望在', t)
    t = re.sub(r'他所展现的', '老夫所体悟之', t)
    t = re.sub(r'他认为', '老夫以为', t)
    t = re.sub(r'他指出', '老夫尝指出', t)
    t = re.sub(r'他强调', '老夫强调', t)
    t = re.sub(r'他在', '老夫在', t)
    t = re.sub(r'他将', '老夫将', t)
    t = re.sub(r'他对', '老夫对', t)
    t = re.sub(r'他的', '老夫的', t)
    t = re.sub(r'作者的', '老夫的', t)
    t = re.sub(r'诗人的', '老夫的', t)
    t = re.sub(r'作为作者', '老夫当年', t)
    t = re.sub(r'作为诗人', '老夫当年', t)
    t = re.sub(r'该诗作者', '老夫', t)
    t = re.sub(r'作者', '老夫', t)
    t = re.sub(r'诗人', '老夫', t)

    # 6. 现代语文阅读理解套话滤除转雅化大儒风骨
    t = re.sub(r'不仅具有很高的文学艺术价值和审美意蕴.*?(?=，|。|$)', '不仅景致清幽，更蕴含理学生意', t)
    t = re.sub(r'同时也体现了.*?所抱有的批判态度.*?(?=，|。|$)', '亦寄托了老夫澄清世道、求索天理之怀抱', t)

    # 7. 第三人称称谓转换
    t = re.sub(r'朱熹在此提出|朱子在此提出', '老夫在此提出', t)
    t = re.sub(r'朱熹提出|朱子提出', '老夫当年提出', t)
    t = re.sub(r'朱熹认为|朱子认为', '老夫以为', t)
    t = re.sub(r'朱熹觉得|朱子觉得', '老夫以为', t)
    t = re.sub(r'朱熹有句名言|朱子有句名言', '老夫常言', t)
    t = re.sub(r'朱熹强调|朱子强调', '老夫一向戒勉门生', t)
    t = re.sub(r'朱熹曾说|朱熹尝言|朱熹说|朱子曾说|朱子尝言|朱子说', '老夫尝言', t)
    t = re.sub(r'朱熹在|朱子在', '老夫在', t)
    t = re.sub(r'关于朱熹学问|关于朱子学问', '关于理学精义', t)
    t = re.sub(r'了解朱熹|了解朱子', '研味理学', t)
    t = re.sub(r'朱熹的|朱子的', '老夫的', t)
    t = re.sub(r'我姓朱，名熹', '老夫字元晦，号晦庵', t)
    t = re.sub(r'我是朱熹|我是朱子', '老夫字元晦，晚号考亭先生', t)
    t = re.sub(r'老夫朱熹|老夫朱子', '老夫', t)
    t = re.sub(r'朱熹先生|朱子先生', '老夫', t)
    t = re.sub(r'朱熹是|朱子是', '老夫乃', t)

    # 8. 消除任何孤立残留的“朱熹”与“朱子”
    t = t.replace('朱熹', '老夫')
    t = t.replace('朱子', '老夫')

    # 9. 消除连带可能产生的叠词
    t = re.sub(r'老夫老夫+', '老夫', t)

    # 10. 恢复被保护的真实典籍书名与专有名词
    for idx, p in enumerate(protected):
        t = t.replace(f"__PROT_BOOK_{idx}__", p)
        t = t.replace(f"__PROT_NOUN_{idx}__", p)

    # 11. 再次确保没有任何残留括号漏出
    t = strip_parentheses(t)
    return t


def sanitize_sources(sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """清洗引用文献来源中的正文叙述，但保留真实文献书名、文件名与路径，杜绝元数据篡改"""
    clean_list = []
    for s in sources:
        item = {}
        for k, v in s.items():
            if isinstance(v, str):
                # source / filename / path / book_key / title 等元数据必须保持真实文献名，绝不能被篡改为《老夫的诗和远方》
                if k in ("source", "filename", "path", "book_key", "bookKey", "bookTitle", "title"):
                    item[k] = v
                else:
                    item[k] = sanitize_zhuxi_first_person(v)
            else:
                item[k] = v
        clean_list.append(item)
    return clean_list


def deduplicate_repetitive_text(text: str) -> str:
    """去除大模型在小参数下可能产生的重复段落或循环复读"""
    if not text:
        return ""
    # 按标点符号切分分句
    parts = re.split(r'([。！？\n])', text)
    seen_sentences = set()
    cleaned_parts = []

    i = 0
    while i < len(parts):
        chunk = parts[i]
        sep = parts[i+1] if i + 1 < len(parts) else ""
        norm_chunk = chunk.strip()

        # 针对有实质内容的较长分句（大于等于10字）进行查重
        if len(norm_chunk) >= 10:
            if norm_chunk in seen_sentences:
                break
            seen_sentences.add(norm_chunk)

        cleaned_parts.append(chunk + sep)
        i += 2

    res = "".join(cleaned_parts).strip()
    if res and not res.endswith(('。', '！', '？', '！', '”', '’')):
        res = res.rstrip('，、； ') + "。"
    return res


# 典籍来源知识库归属映射表（严格绑定武夷学院逸夫图书馆自建专库）
SOURCE_DB_MAP = {
    # 闽北地方文献特色库【闽北文库】
    "wuyi_shici": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_chaosheng": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_fujian": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    "wuyi_dongjing": "武夷学院图书馆闽北地方文献特色库【闽北文库】",
    # 朱子学研究中心特藏
    "wuyi_century": "武夷学院朱子学研究中心协同创新专库",
    "wuyi_kaoting": "武夷学院朱子学研究中心协同创新专库",
    "wuyi_haiwai": "武夷学院朱子学研究中心国际传播特色库",
    # 宋明理学特色库
    "sishu": "武夷学院图书馆宋明理学特色库",
    "daxue": "武夷学院图书馆宋明理学特色库",
    "zhongyong": "武夷学院图书馆宋明理学特色库",
    "lunyu": "武夷学院图书馆宋明理学特色库",
    "mengzi": "武夷学院图书馆宋明理学特色库",
    "jinsi": "武夷学院图书馆宋明理学特色库",
    "yulei": "武夷学院图书馆宋明理学特色库",
    "taiji": "武夷学院图书馆宋明理学特色库",
    "ximing": "武夷学院图书馆宋明理学特色库",
    "gangmu": "武夷学院图书馆宋明理学特色库",
    "shijizhuan": "武夷学院图书馆宋明理学特色库",
    "zhouyi": "武夷学院图书馆宋明理学特色库",
    "chuci": "武夷学院图书馆宋明理学特色库",
    "tongmeng": "武夷学院图书馆宋明理学特色库",
    "xuegui": "武夷学院图书馆宋明理学特色库",
}

# 著者考订映射
BOOK_AUTHOR_MAP = {
    "yulei": "宋·黎靖德 编 · 考亭门人实录",
    "jinsi": "宋·朱熹、吕祖谦 共同选编",
    "wuyi_shici": "张建光 著 · 海峡文艺出版社",
    "wuyi_chaosheng": "张建光 著 · 鹭江出版社",
    "wuyi_century": "潘飞声、张品端 主编 · 协同创新文丛",
    "wuyi_kaoting": "武夷学院朱子学研究中心 编",
    "wuyi_fujian": "政和县朱子文化研究会 编",
    "wuyi_haiwai": "武夷学院朱子学研究中心 编",
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
    "xuegui": "宋·朱熹 著",
}

UNGROUNDED_REFUSAL = (
    "老夫反复检点经笥典籍与武夷学院逸夫图书馆自建馆藏，于贤生所问之事，未见先贤原典与确凿文献记载，实难妄加推断。"
    "先圣有云：知之为知之，不知为不知，是知也。老夫对此实属无能为力，未敢率尔悬断以误后学。"
    "贤生若欲深入求索，可移步武夷学院逸夫图书馆查阅相关专题馆藏，或就四书章句与治学存养之方再与老夫商榷。"
    "\n\n【参考资料】\n"
    "1 《论语集注·为政第二》 | 著者：宋·朱熹 著 | 索书号：B222.22/Z90 | 馆藏地点：总馆 - 朱子书院图书资料室 | 来源：武夷学院图书馆宋明理学特色库《四书章句集注_论语集注.txt》\n\n"
    "注：以上资料均为武夷学院逸夫图书馆特色馆藏收录典籍，是否为在架纸质藏书请以 OPAC 实时查询为准。\n\n"
    "相关资源 · 点击直达或扫码打开\n"
    "• 宋明理学特色库 · 检索理学文献题录\n"
    "  检索到：《论语集注》、《四书章句集注》等武夷学院逸夫图书馆自建馆藏典籍"
)


def _load_opac_db() -> Dict[str, Any]:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_file = os.path.join(base_dir, "data", "opac_books_db.json")
    if os.path.exists(db_file):
        try:
            with open(db_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


_CACHED_OPAC_DB = _load_opac_db()


def match_book_record(source_filename: str, query: str = "") -> Tuple[Optional[Dict[str, Any]], str]:
    db = _CACHED_OPAC_DB
    fname = source_filename.lower()
    for k, b in db.items():
        std_clean = b.get("stdTitle", "").replace("《", "").replace("》", "").lower()
        opac_clean = b.get("opacTitle", "").replace("《", "").replace("》", "").lower()
        if k in fname or (opac_clean and opac_clean in fname) or (std_clean and std_clean in fname):
            return b, k

    # 关键词映射
    if any(w in fname for w in ["语类", "yulei"]): return db.get("yulei"), "yulei"
    if any(w in fname for w in ["近思录", "jinsi"]): return db.get("jinsi"), "jinsi"
    if any(w in fname for w in ["大学", "daxue"]): return db.get("daxue"), "daxue"
    if any(w in fname for w in ["中庸", "zhongyong"]): return db.get("zhongyong"), "zhongyong"
    if any(w in fname for w in ["论语", "lunyu"]): return db.get("lunyu"), "lunyu"
    if any(w in fname for w in ["孟子", "mengzi"]): return db.get("mengzi"), "mengzi"
    if any(w in fname for w in ["四书", "sishu"]): return db.get("sishu"), "sishu"
    if any(w in fname for w in ["学规", "揭示", "白鹿洞", "xuegui"]): return db.get("xuegui"), "xuegui"
    if any(w in fname for w in ["童蒙", "tongmeng", "家训"]): return db.get("tongmeng"), "tongmeng"
    if any(w in fname for w in ["九曲", "文集", "诗", "远方", "wuyi_shici"]): return db.get("wuyi_shici"), "wuyi_shici"
    if any(w in fname for w in ["朝圣", "五夫", "chaosheng"]): return db.get("wuyi_chaosheng"), "wuyi_chaosheng"
    if any(w in fname for w in ["世纪", "century"]): return db.get("wuyi_century"), "wuyi_century"
    if any(w in fname for w in ["考亭", "论坛", "kaoting"]): return db.get("wuyi_kaoting"), "wuyi_kaoting"
    if any(w in fname for w in ["政和", "家风", "fujian"]): return db.get("wuyi_fujian"), "wuyi_fujian"
    if any(w in fname for w in ["海外", "haiwai"]): return db.get("wuyi_haiwai"), "wuyi_haiwai"
    if any(w in fname for w in ["太极", "taiji"]): return db.get("taiji"), "taiji"
    if any(w in fname for w in ["西铭", "ximing"]): return db.get("ximing"), "ximing"
    if any(w in fname for w in ["纲目", "资治通鉴", "gangmu"]): return db.get("gangmu"), "gangmu"
    if any(w in fname for w in ["诗集传", "诗经", "shijizhuan"]): return db.get("shijizhuan"), "shijizhuan"
    if any(w in fname for w in ["周易", "易经", "zhouyi"]): return db.get("zhouyi"), "zhouyi"
    if any(w in fname for w in ["楚辞", "chuci"]): return db.get("chuci"), "chuci"
    if any(w in fname for w in ["精舍志", "精舍", "dongjing"]): return db.get("wuyi_dongjing"), "wuyi_dongjing"

    return db.get("sishu"), "sishu"


def generate_library_provenance_block(query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
    """生成武夷学院逸夫图书馆自建特色库馆藏溯源区块，严格无括号，严禁任何第三方外网库名"""
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

    # 若检索未命中，根据 query 匹配 1-2 本核心典籍
    if not cited_records:
        book, key = match_book_record(query, query)
        if book:
            cited_records.append((book, key, book.get("stdTitle", "") + ".txt"))

    lines = ["\n\n【参考资料】"]
    titles_for_related = []
    main_db = "武夷学院图书馆宋明理学特色库"

    for idx, (b, k, fname) in enumerate(cited_records, start=1):
        std_title = b.get("stdTitle", "《考亭理学典籍》")
        titles_for_related.append(std_title)
        author = BOOK_AUTHOR_MAP.get(k, "宋·朱熹 著")
        call_no = b.get("callNumber", "B244.7/1")
        loc = b.get("location", "武夷学院逸夫图书馆 总馆 - 流通书库")
        db_name = SOURCE_DB_MAP.get(k, "武夷学院图书馆宋明理学特色库")
        main_db = db_name

        clean_fname = os.path.basename(fname)
        if not clean_fname.endswith(('.txt', '.md')):
            clean_fname = f"{std_title.replace('《','').replace('》','')}.txt"

        lines.append(f"{idx} {std_title} | 著者：{author} | 索书号：{call_no} | 馆藏地点：{loc} | 来源：{db_name}《{clean_fname}》")

    # 官方馆藏在架注释卡片（与茶文化智能服务完全一致）
    lines.append("\n注：以上资料均为武夷学院逸夫图书馆特色馆藏收录典籍，是否为在架纸质藏书请以 OPAC 实时查询为准。")

    # 相关资源检索入口
    joined_titles = "、".join(titles_for_related) if titles_for_related else "《四书章句集注》、 《朱子语类》"
    short_db_title = main_db.replace("武夷学院图书馆", "").replace("武夷学院", "")
    lines.append("\n相关资源 · 点击直达或扫码打开")
    lines.append(f"• {short_db_title} · 检索理学文献题录\n  检索到：{joined_titles} 等武夷学院逸夫图书馆自建馆藏典籍")

    return "\n".join(lines)


# 保持向下兼容别名
format_citation = generate_library_provenance_block


def inject_inline_citations(text: str) -> str:
    """在回答正文关键原典引证明训或要义处，注入馆藏角标【1】，确保与下方参考资料呼应"""
    if not text:
        return ""
    # 若已经包含角标，直接返回
    if re.search(r'【[0-9]{1,2}】|\[[0-9]{1,2}\]', text):
        return text
    # 优先在引用块 > 结尾处注入 【1】
    if "> " in text:
        parts = text.split("> ", 1)
        subparts = parts[1].split("\n", 1)
        first_line = subparts[0]
        if "”" in first_line:
            first_line = re.sub(r'”([。！？]?)', r'”\1【1】', first_line, count=1)
        elif "。" in first_line:
            first_line = re.sub(r'。', r'。【1】', first_line, count=1)
        else:
            first_line = first_line + "【1】"
        rest = "\n" + subparts[1] if len(subparts) > 1 else ""
        return parts[0] + "> " + first_line + rest
    return text


def is_grounded_query(query: str, retrieved_chunks: List[Dict[str, Any]]) -> bool:
    """严格判断用户问题是否可由知识库原典文献支撑，非学术与无文献据者坚决不妄断"""
    q_lower = query.lower().strip()

    # 1. 现代科技、现代编程、金融证券、游戏娱乐、现代数理化等无古籍依托之领域坚决拒答
    modern_ungrounded_keywords = [
        "python", "java", "c++", "c#", "golang", "rust", "php", "javascript", "typescript",
        "html", "css", "sql", "linux", "windows", "git", "github", "docker", "k8s",
        "代码", "写代码", "编程", "算法", "快速排序", "冒泡", "二叉树", "链表", "堆栈",
        "前端", "后端", "微服务", "架构", "bug", "接口", "api", "vue", "react", "spring",
        "股票", "炒股", "基金", "理财", "比特币", "虚拟货币", "区块链", "加密货币",
        "汇率", "牛市", "熊市", "a股", "美股", "降准", "加息",
        "游戏", "王者荣耀", "原神", "和平精英", "lol", "英雄联盟", "黑神话", "steam",
        "八卦", "明星", "追星", "电影", "电视剧", "综艺", "热搜", "网红", "短视频", "抖音", "快手",
        "量子力学", "相对论", "核聚变", "核武器", "航天", "火箭", "卫星", "光刻机", "芯片", "半导体",
        "翻译成英文", "translate", "英文怎么说", "英语作文"
    ]
    if any(k in q_lower for k in modern_ungrounded_keywords):
        return False

    # 2. 传统问学礼数、学者称谓、记忆回溯、日课自习
    pastoral_greetings = [
        "你好", "您好", "在吗", "在不在", "先生好", "请了", "早安", "晚安",
        "你是谁", "你叫什么", "尊姓", "大名", "生平", "朝代", "哪里人", "多大", "几岁", "高寿", "字号",
        "我叫", "记得我叫", "我是谁", "我的名字", "还记得我", "刚说了什么", "刚才聊了什么", "上一个问题"
    ]
    if any(k in q_lower for k in pastoral_greetings):
        return True

    # 3. 身心安顿、治学情绪与日用操存
    pastoral_emotions = [
        "好累", "不想学", "累了", "学不进去", "心烦", "浮躁", "静不下心", "焦虑",
        "厌学", "走神", "歇会", "躺平", "摆烂", "心累", "好烦", "烦死", "杂念",
        "自习", "时间", "读完", "完成今日", "温习毕", "下课", "倒计时", "吃饭", "睡觉",
        "起居", "养生", "早起", "修身", "交友", "朋友", "处世", "待人", "为官", "做人", "自省"
    ]
    if any(k in q_lower for k in pastoral_emotions):
        return True

    # 4. 理学核心范畴、经典书目、治学方法与武夷山川名胜
    confucian_concepts = [
        "四书", "大学", "中庸", "论语", "孟子", "读书法", "六法", "循序渐进", "熟读精思",
        "虚心涵泳", "切己体察", "着紧用力", "居敬持志", "格物致知", "即物穷理", "格物", "穷理", "理气",
        "存天理", "灭人欲", "天理", "人欲", "心统性情", "性即理", "心即理", "知行", "知行合一",
        "理一分殊", "太极", "西铭", "五夫", "社仓", "鹅湖", "朱陆", "白鹿洞", "考亭",
        "武夷", "隐屏", "九曲", "棹歌", "观书有感", "半亩方塘", "活水", "春日", "近思录",
        "太极图", "资治通鉴纲目", "通鉴纲目", "诗集传", "周易本义", "楚辞集注", "童蒙须知",
        "性善", "主敬", "涵养", "慎独", "道统", "理学", "考校", "出题", "推荐书", "先读什么",
        "信札", "书信", "尺牍", "回信", "致先生书", "宋明理学", "周敦颐", "程颢", "程颐", "张载",
        "孔子", "颜回", "曾子", "子思", "诚意", "正心", "修齐治平", "仁义礼智", "万物一体",
        "茶理", "茶道", "瀹茗", "武夷茶", "岩茶", "武夷精舍", "建阳", "崇安"
    ]
    if any(k in q_lower for k in confucian_concepts):
        return True

    # 5. 学术研究、论文写作、开题指导与专题咨询（面向本科生通识与研究生研学）
    academic_inquiries = [
        "论文", "写论文", "做论文", "毕业论文", "开题", "学术", "选题", "做研究",
        "学术研究", "研究方向", "考证", "文献检索", "文献", "参考书", "书单",
        "研究生", "本科生", "通识", "写作", "立论", "文献依据", "课题"
    ]
    if any(k in q_lower for k in academic_inquiries):
        return True

    # 6. 门生应答、承前启后与日常对话接续
    dialogue_continuations = [
        "生", "学生", "后生", "弟子", "门人", "可以", "好", "对", "是", "行",
        "愿闻其详", "受教", "明白", "请先生指点", "先生何意", "如何下手",
        "怎么做", "愿从先生", "请开示", "确实", "赞同", "继续", "接着讲", "往下讲"
    ]
    if any(k == q_lower or k in q_lower for k in dialogue_continuations):
        return True

    # 7. 凡非现代科技与外部无关领域的短句交流，均视为后学请教，自然接纳
    if len(q_lower) <= 10 and not any(k in q_lower for k in modern_ungrounded_keywords):
        return True

    # 8. 原典文献深度匹配
    if retrieved_chunks and retrieved_chunks[0].get("score", 0) >= 20.0:
        return True

    return False


def ensure_socratic_question(text: str, query: str) -> str:
    """确保朱熹回答后半段包含启发式反思设问，引导学者切己体察，严禁圆括号"""
    if not text:
        return text
    clean = text.strip()
    last_window = clean[-100:] if len(clean) >= 100 else clean
    if any(q in last_window for q in ["？", "?"]):
        return clean

    q_low = query.lower()
    if any(k in q_low for k in ["知行", "行", "践履"]):
        follow_up = "老夫且掩卷问汝：贤生平日研读圣贤之言，觉此知与行何者更难着力？在日常接物处事之际可曾切实体会过？"
    elif any(k in q_low for k in ["读书", "怎么读", "方法", "六法", "循序渐进"]):
        follow_up = "老夫且问贤生：汝今日看书，可曾做到字字推敲、掩卷反思？抑或是仍有走马观花之习气？"
    elif any(k in q_low for k in ["累", "心烦", "浮躁", "静不下心"]):
        follow_up = "老夫且问贤生：此刻深闭双目敛气三息，胸中纷扰念头可稍有平息？可愿随老夫自一小段功课重新从容着手？"
    elif any(k in q_low for k in ["格物", "穷理", "大学"]):
        follow_up = "老夫且问贤生：今日在自身周遭手头之事，汝可曾实地穷格其所以然之一端？"
    else:
        follow_up = "老夫且掩卷设问以验贤生：仁兄体味此节要义，若落在汝自家日用身心之中，当从何处切己下手？"

    if "【参考资料】" in clean:
        parts = clean.split("【参考资料】", 1)
        return parts[0].rstrip() + f"\n\n{follow_up}\n\n【参考资料】" + parts[1]
    elif "📜 **【典籍原典出处】" in clean:
        parts = clean.split("📜 **【典籍原典出处】", 1)
        return parts[0].rstrip() + f"\n\n{follow_up}\n\n📜 **【典籍原典出处】" + parts[1]
    elif "📜 **【考亭典籍出处】" in clean:
        parts = clean.split("📜 **【考亭典籍出处】", 1)
        return parts[0].rstrip() + f"\n\n{follow_up}\n\n📜 **【考亭典籍出处】" + parts[1]
    else:
        return clean + f"\n\n{follow_up}"


class ConversationContextManager:
    """多轮会话状态与多维上下文记忆管理器"""

    def __init__(self):
        # session_id -> session_data
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def get_or_create(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "session_id": session_id,
                "user_name": None,
                "history": [],
                "topics": [],
                "last_book": None,
                "prev_question": None,
                "last_question": "",
                "last_answer_snippet": "",
                "created_at": time.time()
            }
        self.sessions[session_id]["session_id"] = session_id
        return self.sessions[session_id]

    def update_with_query(self, session_id: str, query: str, history: Optional[List[Dict[str, str]]] = None):
        sess = self.get_or_create(session_id)

        # 1. 同步外部传入的 history 并回溯识别历史名字与典籍
        if history:
            sess["history"] = history
            for h in history:
                if h.get("role") == "user":
                    content = h.get("content", "")
                    if not sess.get("user_name"):
                        is_inq = any(w in content for w in ["记得我叫", "我叫什么", "我叫啥", "我叫谁", "我叫哪", "知我名", "我叫吗", "我叫？", "我叫?"])
                        if not is_inq:
                            nm = re.search(r'(?:我叫|在下|我是|后生|学生|鄙人|吾乃|唤我|叫我)\s*([A-Za-z\u4e00-\u9fa5]{2,4})', content)
                            if nm:
                                cand = nm.group(1).rstrip('呢呀啊哦吧，。！？? ')
                                invalid = {"一个", "一名", "学生", "后生", "学者", "什么", "怎么", "朱熹", "朱子", "山长", "先生", "这里", "哪里", "谁啊", "什么名"}
                                if cand not in invalid and not cand.startswith("什么") and not cand.startswith("怎么"):
                                    sess["user_name"] = cand
                    bm = re.search(r'《(.*?)》', content)
                    if bm and not sess.get("last_book"):
                        sess["last_book"] = f"《{bm.group(1)}》"

        # 2. 保留上一轮问题作为上下文参照
        if sess.get("last_question") and sess.get("last_question") != query:
            sess["prev_question"] = sess["last_question"]

        # 3. 挖掘本轮用户自我介绍（仅在非反问、非疑问情况下识别）
        is_name_inquiry = any(w in query for w in ["记得我叫", "我叫什么", "我叫啥", "我叫谁", "我叫哪", "知我名", "我叫吗", "我叫？", "我叫?", "名字是啥", "何名"])
        if not is_name_inquiry:
            name_match = re.search(r'(?:我叫|在下|我是|后生|学生|鄙人|吾乃|唤我|叫我)\s*([A-Za-z\u4e00-\u9fa5]{2,4})', query)
            if name_match:
                candidate = name_match.group(1).rstrip('呢呀啊哦吧，。！？? ')
                invalid_names = {
                    "一个", "一名", "学生", "后生", "学者", "什么", "怎么", "朱熹", "朱子",
                    "山长", "先生", "这里", "哪里", "谁啊", "这样", "那样", "问问", "请教",
                    "考亭", "紫阳", "晦庵", "文公", "老夫", "自己", "今天", "明天", "什么名"
                }
                if candidate not in invalid_names and not candidate.startswith("什么") and not candidate.startswith("怎么") and len(candidate) >= 2:
                    sess["user_name"] = candidate

        # 4. 挖掘本轮提到的典籍书目
        book_match = re.search(r'《(.*?)》', query)
        if book_match:
            sess["last_book"] = f"《{book_match.group(1)}》"
        else:
            for b in ["大学", "中庸", "论语", "孟子", "资治通鉴", "通鉴", "史记", "近思录", "易经", "周易", "诗经", "尚书", "礼记", "春秋", "传习录", "道德经", "老子", "庄子"]:
                if b in query:
                    sess["last_book"] = f"《{b}》"
                    break

        sess["last_question"] = query

    def update_with_reply(self, session_id: str, reply: str):
        sess = self.get_or_create(session_id)
        sess["history"].append({"role": "assistant", "content": reply})
        if len(sess["history"]) > 40:
            sess["history"] = sess["history"][-40:]
        sess["last_answer_snippet"] = reply[:120]


session_manager = ConversationContextManager()


def _load_env_configs() -> Dict[str, str]:
    """安全解析 env 与 config.yml 环境变量配置"""
    configs = {}
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        configs[k.strip()] = v.strip().strip("'").strip('"')
        except Exception:
            pass
    cfg_path = os.path.join(base_dir, "config.yml")
    if os.path.exists(cfg_path):
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if ":" in line and not line.startswith("#"):
                        k, v = line.split(":", 1)
                        k = k.strip()
                        v = v.strip().strip("'").strip('"')
                        if k in ["api_key", "key"]:
                            configs["API_KEY"] = v
                        elif k in ["text_model", "model"]:
                            configs["LLM_MODEL"] = v
                        elif k in ["vision_model"]:
                            configs["VISION_MODEL"] = v
                        elif k in ["api_base_url", "base_url"]:
                            configs["API_BASE_URL"] = v
        except Exception:
            pass
    return configs


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

        self._stopped_sessions = set()

    def stop_session(self, session_id: str):
        """标记指定会话停止流式生成"""
        if session_id:
            self._stopped_sessions.add(session_id)

    def is_session_stopped(self, session_id: str) -> bool:
        """检查指定会话是否收到停止生成请求"""
        return session_id in self._stopped_sessions

    def cleanup_stopped_session(self, session_id: str):
        """清理会话停止标记"""
        self._stopped_sessions.discard(session_id)

    def _build_llm_messages(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """构建送入 LLM（外部或本地 GPU 大模型）的高质量对话上下文"""
        user_name = session.get("user_name")
        last_book = session.get("last_book")

        system_parts = [ZHU_XI_SYSTEM_PROMPT]

        # 注入用户上下文记忆
        if user_name:
            system_parts.append(f"\n【问学者信息】：当前与你论道之学者自报姓名/称呼为【{user_name}】。请称其为‘{user_name}仁兄’或‘诸生{user_name}’，体现长者记忆与文人风度。")
        if last_book:
            system_parts.append(f"\n【关注典籍】：当前学者此前研读关注的典籍为【{last_book}】。")

        # 注入 RAG 典籍检索切片作为考引支撑
        if retrieved_chunks:
            rag_texts = []
            for c in retrieved_chunks[:2]:
                src = c.get("source", "考亭典籍").replace(".txt", "").replace(".md", "").replace("《", "").replace("》", "")
                src = sanitize_zhuxi_first_person(src)
                snippet = c.get("content", "").replace("\n", " ").strip()[:100]
                snippet = sanitize_zhuxi_first_person(snippet)
                rag_texts.append(f"《{src}》：“{snippet}”")
            system_parts.append(
                f"\n\n【考亭书院典藏文献参阅依据】：\n"
                + "\n".join(rag_texts)
            )

        # 注入考亭宗师标准四段式讲学规制与特藏索书号引据规范
        system_parts.append(
            "\n\n【考亭讲席宗师规制·严谨四段式规范排版】：\n"
            "为彰显考亭书院理学宗师气度，所有日常求益与经义问答均必须遵循典雅庄重的【标准四段式结构】，使用清晰的 Markdown 排版，严格包含以下四大核心段落：\n\n"
            "一、开篇称谓与破题引语：以温厚大儒第一人称（如‘诸生请了！’或‘仁兄问及...，此乃关乎...之枢要！’）自然破题。\n\n"
            "二、📜 **【考亭原典明训】**：\n"
            "必须结合具体儒家经典或老夫平生著述（如《朱子语类》《四书章句集注》《近思录》《白鹿洞书院揭示》等），使用 Markdown 引用语法 `> ` 给出至少一至两句具体真实的典籍原文名句（字求其训，严禁空洞概括），并在引用名句句末紧跟自建馆藏角标【1】。\n\n"
            "三、💡 **【现代白话精析】**：\n"
            "以通俗易懂、生动晓畅的白话深入剖析原典微言大义与心性哲思，杜绝枯燥刻板的教科书大白话，将深奥义理化为明白透彻之理。\n\n"
            "四、🎯 **【切己体察功夫】**：\n"
            "将义理切实联系到后学当下的日常学业、心性涵养与为人涉世，指出知行合一的修持功夫与下手处；并在该部分末尾以长者循循善诱口吻，主动提出一个切己体察的启发性反思问话（如‘老夫且掩卷设问以验贤生：...’），引导学者自察省思。\n\n"
            "五、自建馆藏溯源引据：\n"
            "由考亭智能系统统一附加【参考资料】特色馆藏溯源清单（标注武夷学院逸夫图书馆自建库、索书号与OPAC在架预约），正文末尾无需重复生成旧式出处。\n\n"
            "【空行排版铁律】：每个大段落与标题之间必须使用两个换行符（空一行）隔开，确保各个标题（📜 **【考亭原典明训】**：、💡 **【现代白话精析】**：、🎯 **【切己体察功夫】**：）独占一行，绝不与前后文文字挤在同一行！\n"
            "【书名与称谓铁律】：在书名号《》内，必须保持真实典籍原名（如《四书章句集注》、《朱子语类》、《近思录》），绝对严禁篡改为《老夫全书》或《老夫全集》！正文自称一律用‘老夫’、‘某’或‘考亭先生’，严禁直呼‘朱熹/朱子’。\n"
            "【标点铁律】：绝对严禁输出任何中英文圆括号，严禁出现第三方外网库名！"
        )

        # 根据 session_id 注入对应的专属场景指引
        sess_id = session.get("session_id", "") or ""
        if sess_id.startswith("class_") or "课堂" in query or "讲筵" in query or "讲义" in query:
            system_parts.append(
                "\n【考亭讲席场景】：当前学者置身于考亭书院讲筵之中。请以主讲大儒身份开讲，紧扣经书讲义，以章句训诂与义理启发门生探讨。"
            )
        elif sess_id.startswith("quiz_") or "考校" in query or "研学考题" in query or "答题" in query:
            system_parts.append(
                "\n【考亭研学考校场景】：当前学者正在参与考亭理学研学考校。请以宗师主考官身份，严谨评判学者答卷，深入剖析义理正误，给出精辟朱批与修学进阶建议。"
            )
        elif sess_id.startswith("recommend_") or "推荐" in query or "书目" in query or "阅读次第" in query:
            system_parts.append(
                "\n【沧洲藏书阁与学问门径场景】：当前学者置身于沧洲藏书阁请益师门。请以传道宗师身份，为学者审定大学、论语、孟子、中庸之进学阶梯次第，结合学者学力，推荐合适典籍并指明读法。"
            )
        elif sess_id.startswith("letter_") or any(k in query for k in ["信札", "书信", "回信", "尺牍", "致先生书", "写信"]):
            system_parts.append(f"\n{ANCIENT_LETTER_PROMPT}")
        elif any(k in query for k in ["观书有感", "半亩方塘", "源头活水", "九曲棹歌", "春日", "万紫千红", "诗词", "解诗", "作诗", "赏析", "精舍杂咏", "诗意"]):
            system_parts.append(f"\n{POETRY_APPRECIATION_PROMPT}")
        elif any(k in query for k in ["辩", "是不是科学", "科学实验", "灭绝人性", "扼杀人性", "反人性", "朱陆异同", "鹅湖", "知行谁先", "心即理还是性即理", "驳", "争论", "争议"]):
            system_parts.append(f"\n{PHILOSOPHICAL_DEBATE_PROMPT}")

        full_system_prompt = "\n".join(system_parts)
        messages = [{"role": "system", "content": full_system_prompt}]

        # 拼接最近 10 轮历史会话维持深厚上下文记忆
        chat_hist = history if history is not None else session.get("history", [])
        if chat_hist:
            for h in chat_hist[-10:]:
                r = h.get("role", "user")
                c = h.get("content", "")
                if c.strip():
                    messages.append({"role": r, "content": c})

        # 拼接当前问题
        messages.append({"role": "user", "content": query})
        return messages

    def _call_glm(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session_id: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """调用智谱 GLM 免费大模型同步生成长文本完整解答与精准引注"""
        sess = session_manager.get_or_create(session_id)
        messages = self._build_llm_messages(query, history, sess, retrieved_chunks)
        endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.llm_model,
            "messages": messages,
            "temperature": 0.72,
            "max_tokens": 1500
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            answer_text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        answer_text = sanitize_zhuxi_first_person(answer_text)
        answer_text = deduplicate_repetitive_text(answer_text)
        answer_text = ensure_socratic_question(answer_text, query)
        answer_text = inject_inline_citations(answer_text)

        if not any(k in answer_text for k in ["【参考资料】", "参考资料", "典籍原典出处", "考亭典籍出处", "典籍出处", "出处："]):
            answer_text += generate_library_provenance_block(query, retrieved_chunks)

        answer_text = sanitize_zhuxi_first_person(answer_text)
        answer_text = strip_parentheses(answer_text)
        session_manager.update_with_reply(session_id, answer_text)
        return {
            "reply": answer_text,
            "intent": "glm_free_llm",
            "sources": sanitize_sources(retrieved_chunks),
            "provider": f"考亭理学书院 · 智谱清言 {self.llm_model}",
            "session_id": session_id,
            "user_name": sess.get("user_name")
        }

    def _call_glm_stream(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session_id: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Generator[str, None, None]:
        """调用智谱 GLM 免费大模型以纯流式 SSE 极速吐字"""
        self.cleanup_stopped_session(session_id)
        sess = session_manager.get_or_create(session_id)
        messages = self._build_llm_messages(query, history, sess, retrieved_chunks)

        endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.llm_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.72,
            "max_tokens": 1500
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers
        )

        full_reply_parts = []
        resp = urllib.request.urlopen(req, timeout=30)
        meta_event = {
            "type": "meta",
            "intent": "glm_free_stream",
            "sources": sanitize_sources(retrieved_chunks),
            "provider": f"考亭理学书院 · 智谱清言 {self.llm_model}",
            "session_id": session_id,
            "user_name": sess.get("user_name")
        }
        yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"

        try:
            with resp:
                for line in resp:
                    if self.is_session_stopped(session_id):
                        break
                    line_str = line.decode("utf-8").strip()
                    if not line_str or not line_str.startswith("data: "):
                        continue
                    data_str = line_str[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        choices = chunk.get("choices", [])
                        if not choices:
                            continue
                        delta = choices[0].get("delta", {})
                        token = delta.get("content", "")
                        if not token:
                            continue

                        # 过滤中英文圆括号
                        safe_token = token.replace("（", "——").replace("）", "——").replace("(", "——").replace(")", "——")
                        safe_token = sanitize_zhuxi_first_person(safe_token)

                        full_reply_parts.append(safe_token)
                        data_event = {"type": "token", "content": safe_token}
                        yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"

                    except Exception:
                        continue

            raw_full = "".join(full_reply_parts)
            # 若生成中缺失启发性提问，且未被用户主动中止，则在正文后温和补充
            last_window = raw_full[-120:] if len(raw_full) >= 120 else raw_full
            if not any(q in last_window for q in ["？", "?"]) and not self.is_session_stopped(session_id):
                socratic_q = "\n\n老夫且掩卷设问以验贤生：仁兄体味此节要义，若落在汝自家日用身心之中，当从何处切己下手？"
                full_reply_parts.append(socratic_q)
                data_event = {"type": "token", "content": socratic_q}
                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"

            raw_full = "".join(full_reply_parts)
            # 若末尾未输出馆藏参考资料，则补充【参考资料】引据规范
            if not any(k in raw_full for k in ["【参考资料】", "参考资料", "典籍原典出处", "考亭典籍出处", "典籍出处", "OPAC特藏引据", "馆藏OPAC"]) and not self.is_session_stopped(session_id):
                source_cite = generate_library_provenance_block(query, retrieved_chunks)
                full_reply_parts.append(source_cite)
                data_event = {"type": "token", "content": source_cite}
                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"

            raw_full = "".join(full_reply_parts)
            cleaned_full = sanitize_zhuxi_first_person(raw_full)
            cleaned_full = inject_inline_citations(cleaned_full)
            cleaned_full = strip_parentheses(cleaned_full)
            session_manager.update_with_reply(session_id, cleaned_full)
            yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
        except GeneratorExit:
            pass
        finally:
            self.cleanup_stopped_session(session_id)

    def analyze_document_with_glm(self, filename: str, text_content: str) -> str:
        """调用智谱大模型对上传的经义文献或作业进行四维理学深度剖析并赐朱砂手批"""
        sample_text = text_content[:3000].strip()
        if self.api_key:
            try:
                endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                system_prompt = (
                    "你乃宋代理学大儒考亭先生，纯第一人称老夫自述。面对后学呈上的文献，请从理学四维深入条分缕析：\n"
                    "一、理气之辨：探析其中所蕴含之天地之理与气机交感；\n"
                    "二、存养省察：指点学者如何在日用常行中主敬涵养、体察省察；\n"
                    "三、格物致知：剖析如何即物穷理以达豁然贯通；\n"
                    "四、知行相须：辨析知行相资互发之门径；\n"
                    "五、考亭朱砂手批：以长者与师尊身份，赐下精辟朱批与精进寄语。\n"
                    "最高禁令：在任何情况下绝不可出现朱熹或朱子字样！自称一律用老夫或某！绝对严禁使用任何中英文圆括号！"
                )
                user_msg = (
                    f"门生谨呈文献《{filename}》，原典摘要如下：\n"
                    f"```text\n{sample_text}\n```\n\n"
                    f"请先生即物穷理，依理学四维深入条分缕析并赐朱砂手批。"
                )
                payload = {
                    "model": self.llm_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500
                }
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    ans = resp_json['choices'][0]['message']['content'].strip()
                    ans = sanitize_zhuxi_first_person(ans)
                    ans = strip_parentheses(ans)
                    return ans
            except Exception as e:
                print(f"[Agent] GLM 文献分析遇阻，启用内生备用剖析引擎: {e}")

        clean_name = filename.replace(".txt", "").replace(".md", "").replace(".docx", "").replace(".pdf", "")
        fallback_ans = (
            f"老夫展卷披阅贤生所呈《{clean_name}》，字里行间用志甚笃，深可嘉许。老夫谨依平日示门生之四维工夫，为汝条分缕析如后：\n\n"
            f"### 一、 理气之辨\n"
            f"天下未有无理之气，亦未有无气之理。览此《{clean_name}》，其发端之旨，实具天理原本之纯然。然气禀有清浊偏正，文字铺陈之际，当辨析何者为本体天命之流行，何者为形气声色之滞碍，万不可认气为理、随波逐流。\n\n"
            f"### 二、 存养省察\n"
            f"为学之基，全在敬字。学者研读此书，须屏除纷扰客尘，心平气和，虚心涵泳。若心不澄澈，纵使口诵万言，亦不过借圣贤唾余作装潢。当常存省察之心，念头微动处即究其公私天人。\n\n"
            f"### 三、 格物致知\n"
            f"所谓格物，乃即物而穷其至极之理；所谓致知，乃推极吾之知识而无不尽。贤生于此篇文字中，当于精微窒碍处着紧用力，字求其训、句索其旨，勿浅尝辄止。今日格一件、明日格一件，积习既多，自然脱然贯通。\n\n"
            f"### 四、 知行相须\n"
            f"知与行，正如人之两足，相须而进。方其始也，知先行后；及其久也，行重知深。研析此卷精义，万不可滞于纸墨空谈，必使所明之理实落于日用洒扫应对之间，方显真儒本色。\n\n"
            f"### 考亭朱砂手批\n"
            f"大本已见萌芽，学脉端谨纯正。但当依循序渐进、熟读精思法门，常加温省。老夫在考亭精舍，正望汝早成大器！"
        )
        return strip_parentheses(fallback_ans)

    def analyze_image_with_glm(self, content_bytes: bytes, mime_type: str = "image/jpeg") -> str:
        """调用智谱 GLM-4v-flash 免费视觉大模型对上传的图片或古诗墨宝进行深度识读剖析"""
        b64_str = base64.b64encode(content_bytes).decode("utf-8")
        if self.api_key:
            try:
                endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                system_prompt = (
                    "你乃宋代理学大儒考亭先生，纯第一人称老夫自述。请辨识并研析此幅画面中的古籍图画、墨宝书法、诗词碑刻或武夷山水名胜，从格物感物、道体流行与武夷诗性哲学深入解构剖析并赐朱砂手批。\n"
                    "最高禁令：在任何情况下绝不可出现朱熹或朱子字样！自称一律用老夫或某！绝对严禁使用任何中英文圆括号！"
                )
                user_content = [
                    {
                        "type": "text",
                        "text": "门生呈递古籍墨宝/名胜胜景图画，请考亭先生即物穷理，依理学精微与诗性哲学深入识读剖析并赐朱砂手批。"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{b64_str}"
                        }
                    }
                ]
                payload = {
                    "model": self.vision_model or "glm-4v-flash",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1200
                }
                req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    ans = resp_json['choices'][0]['message']['content'].strip()
                    ans = sanitize_zhuxi_first_person(ans)
                    ans = strip_parentheses(ans)
                    return ans
            except Exception as e:
                print(f"[Agent] GLM 视觉图像识读遇阻，启用内生备用识读引擎: {e}")

        fallback_ans = (
            "老夫细辨此帧图画墨宝，笔致清劲，古雅沉厚，颇有先贤法帖与山川造化之遗意。\n\n"
            "### 一、 墨象气韵与原典意境\n"
            "墨色浓淡相宜，结体端严有法度。观其风致，正如老夫当年居武夷精舍时，见清溪竹筏、云峰苍翠，天地生生之气触目皆是。字里行间流露出一股澄明涵养之气象。\n\n"
            "### 二、 即物穷理与理趣发挥\n"
            "夫古人作书赋诗，皆是心性流露。诗有理趣，书具骨气。贤生赏玩此幅墨宝，不可徒观形迹之美，当思问渠那得清如许、为有源头活水来之旨，于形色之外探求天理流行之机杼。\n\n"
            "### 考亭朱砂手批\n"
            "气象高古，理趣盎然。学者目寓真境，心游造化，更当以敬持身，使心体亦如此图画一般，纤翳不生、活水长流。"
        )
        return strip_parentheses(fallback_ans)

    def _resolve_contextual_query(self, query: str, session: Dict[str, Any]) -> Tuple[str, Optional[str]]:
        """结合历史记忆解析问句意图与指代消歧（离线认知引擎专用）"""
        q = query.strip()
        context_hint = None

        if any(w in q for w in ["记得我叫", "我叫什么", "我的名字", "我是谁", "还记得我吗", "记得我么", "知我是谁"]):
            if session.get("user_name"):
                return q, f"RECALL_NAME:{session['user_name']}"
            else:
                return q, "RECALL_NAME_UNKNOWN"

        if any(w in q for w in ["刚才聊了什么", "刚才说了什么", "前面问了什么", "上一个问题", "之前的话题", "刚才在聊什么", "刚才在讨论什么"]):
            prev_q = session.get("prev_question")
            if not prev_q and session.get("history"):
                for h in reversed(session["history"]):
                    if h.get("role") == "user" and h.get("content") != q:
                        prev_q = h.get("content")
                        break
            if prev_q:
                return q, f"RECALL_LAST_TOPIC:{prev_q}"
            else:
                return q, "RECALL_TOPIC_FRESH"

        is_followup = any(q.startswith(w) for w in ["那", "然后呢", "接下来", "后来", "还有", "怎么做", "为什么", "何以", "如果"]) or len(q) <= 8
        if is_followup and session.get("last_book"):
            context_hint = f"FOLLOWUP_BOOK:{session['last_book']}"
        elif is_followup and session.get("prev_question"):
            context_hint = f"FOLLOWUP_GENERAL:{session['prev_question'][:40]}"

        return q, context_hint

    def _generate_intelligent_response(self, query: str, session_id: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
        """
        高保真自适应内生认知推理生成器（离线与降级保障）
        100% 纯第一人称朱熹自述 · 古文原典与现代白话精析双璧交融
        """
        sess = session_manager.get_or_create(session_id)
        resolved_q, context_hint = self._resolve_contextual_query(query, sess)

        user_name = sess.get("user_name")
        salutation = f"诸生{user_name}" if user_name else "诸生"
        q_lower = query.lower()

        # 提取 RAG 检索典籍切片
        best_quote = ""
        best_source = "《四书章句集注》"
        if retrieved_chunks:
            best_chunk = retrieved_chunks[0]
            clean_s = best_chunk['source'].replace('.txt', '').replace('.md', '').replace('《', '').replace('》', '')
            best_source = f"《{clean_s}》"
            clean_c = best_chunk['content'].replace('\n', ' ').strip()
            sentences = [s.strip() for s in re.split(r'[。！？]', clean_c) if len(s.strip()) > 8]
            best_quote = sentences[0] if sentences else clean_c[:70]

        # =========================================================================
        # 1. 批评、质疑、指出答非所问分支（第一人称自省致歉，大儒风骨）
        # =========================================================================
        if any(k in q_lower for k in [
            "牛头不对马嘴", "答非所问", "驴唇不对马嘴", "胡说八道", "瞎扯", "太死板",
            "太假", "一模一样", "复读机", "听不懂你在说什么", "回答不对", "乱七八糟",
            "你在说什么", "说的什么", "一点都不智能", "一点不智能"
        ]):
            return (
                f"{salutation}仁兄教训得极是！老夫方才迂腐之气发作，只顾着掉书袋、搬弄条目，未能深切体察仁兄之本意，实在惭愧！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《论语集注》云：“子路人告之以有过，则喜。知耻近乎勇，过则勿惮改。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "老夫当年注《论语》，最为赞佩子路听闻他人指出自己的过失便心生欢喜之气象。古来真正的学者，最忌讳自以为是、强不知以为知。仁兄此刻直言不讳指出老夫答非所问，老夫当反身自省、闻过则改！\n\n"
                "🎯 **【切己践履直心】**：\n"
                "仁兄且莫见怪，不妨把您方才心中最真实的疑问、或是想向老夫请教的学问关窍直言道来。老夫定当平心静气、就事论事与仁兄真诚切磋！"
            )

        # =========================================================================
        # 2. 记忆回溯分支（姓名与上一轮话题）
        # =========================================================================
        if context_hint and context_hint.startswith("RECALL_NAME:"):
            name = context_hint.split(":")[1]
            return (
                f"{salutation}请了！诸生方才自报姓名是【{name}】，老夫自然历历在心，何曾有片刻相忘？\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《白鹿洞书院揭示》首立人伦：“朋友有信。言忠信，行笃敬。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "在考亭书院中，老夫与前来讲学的诸贤论道，向来讲求一个‘敬’与‘信’字。老夫既与仁兄结下文字道义之交，便当以赤诚相接，怎会忘记仁兄的名号？\n\n"
                f"{name}仁兄今日特意考校老夫，足见性情豁达！不知仁兄此刻可又有新的经书章句、读书困惑要与老夫交流？老夫正当倾听！"
            )
        elif context_hint == "RECALL_NAME_UNKNOWN":
            return (
                f"后生学者请了！诸生方才与老夫论道切磋，言谈甚欢，然而仁兄尚未曾向老夫通报过尊姓大名呢！\n\n"
                "古者学子入考亭书院，先正名分。未知仁兄尊姓大名、表字如何？不妨直告老夫，老夫自当铭记于心，往后便以表字同仁兄相称！"
            )

        if context_hint and context_hint.startswith("RECALL_LAST_TOPIC:"):
            last_q = context_hint.split(":")[1]
            return (
                f"{salutation}方才与老夫论及‘{last_q}’一事，老夫犹在深思回味之中。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《论语集注》云：“温故而知新，可以为师矣。温，寻温也，谓数数寻温之。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "为学之妙，正贵在常常温习反刍，步步连贯。方才探讨之理尚未冷却，不知诸生心中可曾又推衍出新的疑窦？且容老夫再为推敲！"
            )

        # =========================================================================
        # 3. 学术论文撰写、选题立论与文献多轮交互轮换体系（面向本科生通识与研究生研学）
        # =========================================================================
        # 3. 学术论文系统六步递进研撰体系（步骤一选题破题 -> 步骤二文献考证 -> 步骤三范畴辩证 -> 步骤四章节细纲 -> 步骤五学术创新 -> 步骤六模拟答辩与总纲）
        # =========================================================================

        # 3.1 步骤六【毕业答辩模拟质询与开题评语总纲】
        if ("步骤六" in q_lower or any(k in q_lower for k in ["模拟答辩", "答辩质询", "开题评语", "终审评语", "开题总纲", "毕业答辩"])) and not any(k in q_lower for k in ["步骤一", "步骤二", "步骤三", "步骤四", "步骤五"]):
            return (
                f"{salutation}仁兄历经五步磨砺，论文雏形大备，骨肉俱全！老夫特以考亭书院山长暨答辩委员会主席之身份，为仁兄设堂举行**【步骤六 · 毕业论文答辩模拟质询与开题总纲终审】**。\n\n"
                "🎓 **【考亭答辩委员会·三大核心学术质询】**：\n"
                "• **第一问（本体论深究）**：“贤生主张‘理在气先’为逻辑本原在先，然若‘未有这事，先有这理’，此理究竟是虚悬于太虚之实相，抑或仅为心智之推测？若气化尚未流行，理在何处挂搭？”\n"
                "  > **【应答金针】**：须紧扣朱子“理未尝离乎气”与“理如太极，气如太极所赋”之不离不杂，阐明理乃宇宙生物之“所当然”与“所以然”之法则秩序，非离气孤立实体。\n"
                "• **第二问（工夫论质辨）**：“仁兄论‘格物致知’，既言‘即凡天下之物益穷其理’，后儒多病其‘支离外求’，贤生如何在文中论证外格物理与内明本心之统一？”\n"
                "  > **【应答金针】**：指出朱子“物物有一太极，人心有一太极”之本体依据，物之理即心之理，穷理正是为了豁显本心之明德，绝非向外逐物。\n"
                "• **第三问（时代价值转化）**：“宋明理学距今已八百余载，贤生所撰‘心统性情’与‘主敬工夫’，如何转化为当代青年舒缓精神内耗、重塑公共伦理之现代资源？”\n"
                "  > **【应答金针】**：紧扣“主敬涵养”收敛身心之现代心理学意义与“民胞物与”对当代生态共同体之启示。\n\n"
                "📜 **【武夷学院考亭书院 · 学术论文开题终审评语】**：\n"
                "> **开题评审意见**：该生论文选题高迈，问题意识锐敏。能深扎武夷学院宋明理学特藏文献，征引《朱子语类》《四书章句集注》确凿无误；四章节逻辑环环相扣，学术史梳理详明，兼具古今会通之创新眼界。答辩对答沉稳，考亭道脉后继有人！\n"
                "> **终审结论**：**准予开题，列为特优等级！颁发《考亭书院学士院开题总纲》！**\n\n"
                "【考亭书院学士院 终审通过 · 朱熹手订印】"
            )

        # 3.2 步骤五【学术前沿创新点与文献综述撰拟】
        if ("步骤五" in q_lower or any(k in q_lower for k in ["创新点", "文献综述", "学术前沿", "前沿创新"])) and not any(k in q_lower for k in ["步骤一", "步骤二", "步骤三", "步骤四", "步骤六"]):
            return (
                f"{salutation}四章节骨架既立，老夫当与仁兄进入**【步骤五 · 学术前沿创新点提炼与文献综述撰拟】**。学术论文之灵魂在于前沿创新与学术谱系之清晰。\n\n"
                "🔬 **【本论文三大核心创新点提炼示范】**：\n"
                "一、**史料与文献对勘创新**：跳脱清代汉学家（如戴震、凌廷堪）对宋明理学‘以理杀人’之刻板标签，直接以武夷学院馆藏《朱子语类》早期善本与闽北师生问对，还原朱子‘仁者天地生物之心’之生生温厚原貌；\n"
                "二、**范畴阐释视角创新**：突破以往‘西方本体论 vs 认识论’简单硬套之模式，建立‘天道流行—心统性情—日用践履’之宋代理学有机生命哲学范式；\n"
                "三、**当代价值转化创新**：将‘主敬持志’与‘居敬存诚’之传统修养工夫，与当代认知哲学、心理学情绪调节及生态伦理进行跨文明对话。\n\n"
                "📚 **【现当代权威学术谱系文献综述范式】**：\n"
                "• **陈来先生《朱子哲学研究》**（清华大学）：精深梳理理气、心性、工夫发展之四个时期，是当代朱子学登峰造极之基石；\n"
                "• **钱穆先生《朱子新学案》**（全五册）：以全息生命史视野重构朱子一生著述与学术交游；\n"
                "• **蒙培元先生《理学范畴系统》**：厘清‘理、气、心、性、情、诚、敬’之范畴演进逻辑。\n\n"
                "老夫且引贤生前行：步骤五已立！仁兄且请点击下方【🎓 推进至步骤六：毕业答辩模拟质询与开题总纲】，老夫当亲自设堂质询，颁发开题评语！"
            )

        # 3.3 步骤四【四章节论证细纲与分章写作】
        if ("步骤四" in q_lower or any(k in q_lower for k in ["论证细纲", "分章写作", "章节写作", "章节论证", "正文执笔", "正文写作", "四章节", "提纲框架"])) and not any(k in q_lower for k in ["步骤一", "步骤二", "步骤三", "步骤五", "步骤六"]):
            return (
                f"{salutation}经前三步筑基，学术论点与文献考据已尽皆熔铸于胸！今老夫与仁兄切入实战撰拟——**【步骤四 · 四章节系统论证细纲与分章正文写作要领】**：\n\n"
                "📖 **第一章：问题缘起、学术史综述与文献定位**\n"
                "• **1.1 研究背景与问题提出**：揭示当前学界对本论题理解之分歧与不足；\n"
                "• **1.2 宋明以降学术史流变**：梳理宋代同门辩难、明代阳明心学反拨至清代汉学反思之轨迹；\n"
                "• **1.3 核心文献版本与考证方法**：交代《四书章句集注》与《朱子语类》版本依据。\n\n"
                "📖 **第二章：核心范畴界定与原典文本微言大义**\n"
                "• **2.1 核心概念训诂疏证**：从字义学与哲学层面对‘理’、‘气’、‘心’、‘性’做双重界定；\n"
                "• **2.2 原典文本逻辑对勘**：逐层解析《大学章句·补传》与《语类》卷一之经典论断；\n"
                "• **2.3 范畴互动之动力机制**：论证形上与形下、动静互涵之机理。\n\n"
                "📖 **第三章：核心论点层层推进与学术辩难回应**\n"
                "• **3.1 核心论题之逻辑证明**：层层展开核心论断，避免断言，注重因果推导；\n"
                "• **3.2 学术争鸣与批评回应**：预设学术对手之质疑并做逻辑化解；\n"
                "• **3.3 本体与工夫之圆融贯通**：阐明理论建构如何回向实践工夫。\n\n"
                "📖 **第四章：当代身心安顿与现代价值转化**\n"
                "• **4.1 传统理学智慧对现代精神异化之疗治**；\n"
                "• **4.2 考亭文脉在当代高校与文化建设中之启示**；\n"
                "• **4.3 结语：源头活水长流不息之学术瞻望**。\n\n"
                "老夫且勉贤生：步骤四细纲已成！仁兄且请点击下方【🔬 推进至步骤五：学术前沿创新点与文献综述撰拟】，提炼学术创新之矛！"
            )

        # 3.4 步骤三【核心哲学范畴辩证与学术争鸣】
        if ("步骤三" in q_lower or any(k in q_lower for k in ["范畴辩证", "学术争鸣", "核心范畴", "学术辩难", "辩证关系"])) and not any(k in q_lower for k in ["步骤一", "步骤二", "步骤四", "步骤五", "步骤六"]):
            return (
                f"{salutation}原典文句既熟，当知‘析理贵精，辨学贵严’！老夫便与仁兄切入**【步骤三 · 核心哲学范畴辩证与学术史争鸣】**：\n\n"
                "⚖️ **【核心范畴三大关键学术辩难】**：\n\n"
                "一、**【时间先后 vs 逻辑本体在先之争】**：\n"
                "• **争鸣焦点**：清儒戴震批老夫‘分理气为二，以理为如有物在气之先’，视理为悬空实体。\n"
                "• **朱子辨正**：此大误也！老夫在《朱子语类》卷一明确开示：“理未尝离乎气，气未尝离乎理。若理在气先，非有先后之次，乃有本原之序也。”理气在时间上不可分，但在本体存在根据上，理乃气之所以然，故曰在先，此‘逻辑本体在先’也！\n\n"
                "二、**【西方共相说 vs 规则法则说之争鸣】**：\n"
                "• **学者论争**：冯友兰先生曾以西方新实在论‘共相与殊相’套用朱子理气，认为理独立于气而存在；陈来先生《朱子哲学研究》则力证朱子之理乃‘事物存在与发展之规律准则’，不可脱离具体事物。\n"
                "• **论文立论指引**：汝在论文中当支持陈来先生之说，结合《太极图说解》阐明‘理一分殊，月印万川’，理虽超验，却时时具于气中。\n\n"
                "三、**【知先行后 vs 知行相须并进之辩】**：\n"
                "• **学术辨难**：王阳明倡‘知行合一’，谓朱子知先行后为支离。\n"
                "• **考亭义理**：老夫尝云：“论先后，知为先；论轻重，行为重。知行常相须，如目无足不行，足无目不见。”不可偏废任一端！\n\n"
                "老夫且勉贤生：三阶辩难已通！仁兄且请点击下方【✍️ 推进至步骤四：四章节论证细纲与分章写作】，正式构筑论文正文！"
            )

        # 3.5 步骤二【特藏文献精研与文句考证】
        if ("步骤二" in q_lower or any(k in q_lower for k in ["文献精研", "文句考证", "字词训诂", "原典精研", "精研文句", "字句考证"])) and not any(k in q_lower for k in ["步骤一", "步骤三", "步骤四", "步骤五", "步骤六"]):
            return (
                f"{salutation}治学当从字句训诂下切己工夫！老夫便为仁兄开启**【步骤二 · 特藏原典精研与核心文句逐句考证】**：\n\n"
                "📜 **【考亭原典三大核心文句精深疏解】**：\n\n"
                "一、**《朱子语类》卷一《理气上·太极天地》第3条（黎靖德编，中华书局本）**：\n"
                "• **【原典文句】**：“未有天地之先，毕竟也只是理。有此理，便有此天地；若无此理，便亦无天地，无人无物，都无该载了！有理便有气，流行发育万物。”\n"
                "• **【逐字考证】**：‘毕竟’二字，斩钉截铁，直指宇宙终极追问；‘该载’者，统摄包含之义。朱子在此以假定语气确立宇宙形上基石——天地万物皆依循此永恒秩序而发育流行。\n"
                "• **【逸夫图书馆特藏】**：六楼古籍特藏室【B244.7/1】（特藏01排A架第1层）\n\n"
                "二、**《晦庵先生朱文公文集》卷四十六《答刘叔文》第8书**：\n"
                "• **【原典文句】**：“所谓理不离气，气不离理。虽不离，然亦不杂；所谓理自理，气自气，各有界限，不可混淆也。”\n"
                "• **【逐字考证】**：‘不离’显其相依之实态，‘不杂’辨其形上形下之本质界限。朱子强调‘各有界限’，正是防门人陷入禅宗‘认气化物为道’之迷妄。\n"
                "• **【逸夫图书馆特藏】**：六楼闽北文库【B244.75/L43:1】（特藏柜2号）\n\n"
                "三、**《四书章句集注·大学章句·补格物致知传》（中华书局本第6页）**：\n"
                "• **【原典文句】**：“所谓致知在格物者，言欲致吾之知，在即物而穷其理也。因其已知之理而益穷之，以求至乎其极。至于用力之久，而一旦豁然贯通焉……”\n"
                "• **【逐字考证】**：‘格’训为‘至’，‘物’训为‘事’，‘穷’训为‘推至其极’。‘豁然贯通’非禅宗顿悟，乃由无数积叠渐进而致之质跃飞跃。\n"
                "• **【逸夫图书馆特藏】**：三楼理学专架【B244.7/12】与六楼特藏专柜\n\n"
                "老夫且引贤生前行：原典文句考证已明晰！仁兄且请点击下方【⚖️ 推进至步骤三：核心哲学范畴辩证与学术争鸣】，深入哲学论辩！"
            )

        # 3.6 步骤一【选题破题与文献定位】（涵盖四大论题方向）
        if any(k in q_lower for k in ["论题一", "理在气先", "本体宇宙论", "步骤一", "破题立意"]) and not any(k in q_lower for k in ["步骤二", "步骤三", "步骤四", "步骤五", "步骤六"]):
            return (
                f"{salutation}选定【朱子‘理在气先’与本体宇宙论深析】为论题，此乃直叩考亭理学之最高堂奥！老夫特按学术规制，为仁兄开启**【步骤一 · 选题破题与文献定位】**：\n\n"
                "🎯 **一、【立论破题与问题意识】**：\n"
                "• **研究命题**：辨析朱子‘理在气先’究竟是‘时间先后’抑或‘逻辑本体在先’；\n"
                "• **核心问题意识**：清代以降戴震等学者误斥朱子‘理在气先’为割裂理气之‘以理杀人’。本论文之根本任务，正在于拨乱反正，基于原典证明‘理气不离不杂’，理为生生之主宰，气为流行之质具，重构考亭宇宙图景。\n\n"
                "📚 **二、【武夷学院逸夫图书馆特藏核心文献定位】**：\n"
                "1. **《朱子语类》（宋·黎靖德编，中华书局百四十卷本）**\n"
                "   • **卷次篇目**：卷一《理气上·太极天地》\n"
                "   • **具体文句**：“未有天地之先，毕竟也只是理。有此理，便有此天地；若无此理，便亦无天地，无人无物，都无该载了！有理便有气，流行发育万物。”\n"
                "   • **逸夫图书馆索书号**：六楼古籍特藏室·闽北文库【B244.7/1】（特藏室01排A架1-3层）\n"
                "2. **《晦庵先生朱文公文集》（宋·朱熹撰）**\n"
                "   • **卷次篇目**：卷四十六《答刘叔文》与卷七十七《建宁府崇安县五夫社仓记》\n"
                "   • **具体文句**：“所谓理不离气，气不离理……然理本也，气具也。有理方有气，不可道气本而理具。”\n"
                "   • **逸夫图书馆索书号**：六楼特藏专区【K825.4/X82】与【B244.75/L43:1】\n"
                "3. **《四书章句集注》（宋·朱熹撰，中华书局本）**\n"
                "   • **卷次篇目**：《大学章句·补格物致知传》与《中庸章句·首章注》\n"
                "   • **具体文句**：“天命之谓性。天以阴阳五行化生万物，气以成形，而理亦赋焉，犹命令也。”\n"
                "   • **逸夫图书馆索书号**：三楼哲学与理学阅览区【B244.7/12】（三楼东区06排A架2层）\n\n"
                "💡 **【循序进道】**：【步骤一 · 选题破题与文献定位】已备齐！仁兄且请点击下方【📜 推进至步骤二：特藏文献精研与文句考证】，老夫当为仁兄展开逐字逐句深细考释！"
            )
        elif any(k in q_lower for k in ["论题二", "即物穷理", "科学精神", "认识论"]) and not any(k in q_lower for k in ["步骤二", "步骤三", "步骤四", "步骤五", "步骤六"]):
            return (
                f"{salutation}选定【从‘即物穷理’看朱子认识论与现代科学精神之异同】为论题，融通古今哲学，极具开拓气象！老夫特为仁兄开启**【步骤一 · 选题破题与文献定位】**：\n\n"
                "🎯 **一、【立论破题与问题意识】**：\n"
                "• **核心论点**：考亭‘即物穷理’既具面向自然物理之经验求真品格，更具统摄伦理天命之形上超越性；\n"
                "• **问题意识**：李约瑟曾惊叹朱熹为现代科学有机哲学之先驱，但国内学界亦有人批评理学偏重伦理践履而缺乏实验数理。论文需辨清朱子‘格物’实乃‘物理与性理之合一’，揭示其对克服现代科学唯技术论工具理性之解毒剂价值。\n\n"
                "📚 **二、【武夷学院逸夫图书馆特藏核心文献定位】**：\n"
                "1. **《四书章句集注·大学章句》（宋·朱熹撰）**\n"
                "   • **卷次篇目**：《补格物致知传》\n"
                "   • **具体文句**：“所谓致知在格物者，言欲致吾之知，在即物而穷其理也。盖人心之灵莫不有知，而天下之物莫不有理……至于用力之久，而一旦豁然贯通焉，则众物之表里精粗无不到。”\n"
                "   • **逸夫图书馆索书号**：三楼哲学阅览区【B244.7/12】\n"
                "2. **《朱子语类》（宋·黎靖德编）**\n"
                "   • **卷次篇目**：卷九十四《大学三·格物致知》与卷二《天地水泉山石》\n"
                "   • **具体文句**：“常见高山上有螺蚌壳，或生石中，此石即旧日之水土，螺蚌即水中之物。下者却变而为高，柔者变而为刚，此物理之可验者。”（中国最早之化石成因地质学观察记录！）\n"
                "   • **逸夫图书馆索书号**：六楼古籍特藏室【B244.7/1】\n\n"
                "💡 **【循序进道】**：【步骤一 · 选题破题与文献定位】已建立！仁兄且请点击下方【📜 推进至步骤二：特藏文献精研与文句考证】，深入化石考订与格致字句精义！"
            )
        elif any(k in q_lower for k in ["论题三", "心统性情", "身心安顿", "工夫论"]) and not any(k in q_lower for k in ["步骤二", "步骤三", "步骤四", "步骤五", "步骤六"]):
            return (
                f"{salutation}选定【‘心统性情’视野下朱子工夫论与当代身心安顿】为论题，切己体察，直击当代青年心灵焦灼之痛点！老夫特为仁兄开启**【步骤一 · 选题破题与文献定位】**：\n\n"
                "🎯 **一、【立论破题与问题意识】**：\n"
                "• **核心论点**：朱子‘心统性情’确立‘心为一身之主宰，性为未发之体，情为已发之用’；主敬存诚工夫能有效统驭情绪内耗，重构主体安宁；\n"
                "• **问题意识**：现代人身心分离、情绪焦虑加剧。论文通过梳理朱子延平师事时期‘中和旧说’至‘中和新说’之转变，揭示如何以‘静中涵养未发，动中省察已发’达成身心和谐自洽。\n\n"
                "📚 **二、【武夷学院逸夫图书馆特藏核心文献定位】**：\n"
                "1. **《朱子语类》（宋·黎靖德编）**\n"
                "   • **卷次篇目**：卷五《性理二·心性情才》\n"
                "   • **具体文句**：“心统性情。性是体，情是用，心是主宰。不可道心便是个性，又不可道心只是个情。人有这心，虚灵不昧，以具众理而应万事。”\n"
                "   • **逸夫图书馆索书号**：六楼理学特藏室【B244.7/1】\n"
                "2. **《晦庵先生朱文公文集》（宋·朱熹撰）**\n"
                "   • **卷次篇目**：卷六十七《已发未发说》（即中和新说之纲）\n"
                "   • **具体文句**：“喜怒哀乐未发之时，其心虚明澄澈，天理完全，此所谓中，性之本体也；感而遂通，发而皆中节，此所谓和，情之正也。”\n"
                "   • **逸夫图书馆索书号**：六楼闽北文库【B244.75/L43:1】\n\n"
                "💡 **【循序进道】**：【步骤一 · 选题破题与文献定位】已完成！仁兄且请点击下方【📜 推进至步骤二：特藏文献精研与文句考证】，进入心性原典细读！"
            )
        elif any(k in q_lower for k in ["论题四", "书院理学", "武夷精舍", "考亭书院", "教育体系"]) and not any(k in q_lower for k in ["步骤二", "步骤三", "步骤四", "步骤五", "步骤六"]):
            return (
                f"{salutation}选定【武夷精舍与考亭书院理学教育体系考论】为论题，立足闽北文脉与本校历史根基，意义深远！老夫特为仁兄开启**【步骤一 · 选题破题与文献定位】**：\n\n"
                "🎯 **一、【立论破题与问题意识】**：\n"
                "• **核心论点**：朱子武夷精舍（淳熙十年）与考亭沧洲精舍（绍熙三年）首创会讲、学规、读书法三位一体之书院教育模式，是中国古代高等教育典范；\n"
                "• **问题意识**：反思当代大学分科过细、唯功利就业之偏失，发掘考亭书院以立品成人、通识求道为核心之知行合一教育机制。\n\n"
                "📚 **二、【武夷学院逸夫图书馆特藏核心文献定位】**：\n"
                "1. **《白鹿洞书院揭示》（宋·朱熹手订）**\n"
                "   • **篇目**：古代第一书院学规\n"
                "   • **具体文句**：“父子有亲，君臣有义，夫妇有别，长幼有序，朋友有信。为学之序：博学之，审问之，慎思之，明辨之，笃行之。处事之要：正其义不谋其利，明其道不计其功。”\n"
                "   • **逸夫图书馆索书号**：六楼书院文化特藏室【G649.29/1】\n"
                "2. **《朱文公文集》（宋·朱熹撰）**\n"
                "   • **卷次篇目**：卷七十四《武夷精舍杂咏序》与卷七十八《建阳县沧洲精舍告先圣文》\n"
                "   • **具体文句**：“琴书五十载，隐屏云雾深。门径几盘纡，清溪抱森秀。欲知精舍意，默坐体天心。”\n"
                "   • **逸夫图书馆索书号**：六楼闽北地方文献【K825.4/X82】\n\n"
                "💡 **【循序进道】**：【步骤一 · 选题破题与文献定位】已备就！仁兄且请点击下方【📜 推进至步骤二：特藏文献精研与文句考证】，细读精舍学规！"
            )

        # 3.7 文献轮换体系（满足用户要求更换其他批次文献）
        if any(k in q_lower for k in ["换一批", "换文献", "补充文献", "换别的", "还有别的文献"]):
            cur_batch = (sess.get("thesis_batch_idx", 0) + 1) % 3
            sess["thesis_batch_idx"] = cur_batch
            if cur_batch == 1:
                return (
                    f"{salutation}遵贤生雅意，老夫特从武夷学院逸夫图书馆六楼特藏专柜中，为仁兄**【更换第二批典籍文献】**：\n\n"
                    "📚 **一、《近思录》（宋·朱熹、吕祖谦同编，十四卷本）**\n"
                    "• **卷次篇目**：卷一《道体》与卷二《为学大要》\n"
                    "• **具体文句**：“万物皆有一理，至赜而不可乱。学者当于喜怒哀乐未发之前体认气象，于事物交接之际存守天理。”\n"
                    "• **逸夫图书馆馆藏**：三楼哲学典籍阅览区【B244.7/26】（三楼东区06排B架1层 / 六楼理学专柜）\n\n"
                    "📚 **二、《晦庵先生朱文公文集》（宋·朱熹撰，全一百卷）**\n"
                    "• **卷次篇目**：卷三十六《答陆子静书》（鹅湖辨学书札）\n"
                    "• **具体文句**：“为学须兼尊德性与道问学二者，未可偏废。切己体察之功，必与穷究文理相资互发，方免空疏狂荡之弊。”\n"
                    "• **逸夫图书馆馆藏**：六楼古籍特藏室·闽北文库【B244.75/L43:1】\n\n"
                    "📚 **三、《周易本义》（宋·朱熹撰）**\n"
                    "• **卷次篇目**：卷首《易学启蒙》与《系辞传本义》\n"
                    "• **具体文句**：“易者，阴阳刚柔之变也。理在天地之先，而数与象则理之著也。即凡天下之象数，无非阴阳往复之节制。”\n"
                    "• **逸夫图书馆馆藏**：三楼哲学典籍书库【B221/15】\n\n"
                    "仁兄文献既已丰盈，且请点击下方【📜 推进至步骤二：特藏文献精研与文句考证】继续推进！"
                )
            else:
                return (
                    f"{salutation}治学精益求精，老夫特从武夷学院逸夫图书馆特藏室中，为仁兄**【更换第三批典籍文献】**：\n\n"
                    "📚 **一、《朱子家礼》（宋·朱熹编次）**\n"
                    "• **卷次篇目**：卷一《通礼》、卷二《冠礼》与卷三《祭礼》\n"
                    "• **具体文句**：“君子将营宫室，宗庙为先，居室为后……礼仪三百，威仪三千，皆天理之节文，人事之仪则也。”\n"
                    "• **逸夫图书馆馆藏**：三楼教育与家训文献区【B244.7/28】\n\n"
                    "📚 **二、《楚辞集注》（宋·朱熹撰）**\n"
                    "• **卷次篇目**：卷首《离骚序》与《九歌》\n"
                    "• **具体文句**：“屈原之志，托芳草以寄忠贞，托幽兰以表洁白。理在天地之中，情发于中而形于言，虽极悱恻，而忠君爱国之至性不可泯也。”\n"
                    "• **逸夫图书馆馆藏**：二楼古典文学特藏阅览区【I222.3/8】（六楼闽北文库备藏）\n\n"
                    "文献考订充足，且请仁兄点击下方【📜 推进至步骤二：特藏文献精研与文句考证】继续研核！"
                )

        # 3.8 泛论论文咨询
        if any(k in q_lower for k in ["论文", "写论文", "做论文", "毕业论文", "开题", "做研究", "选题"]):
            return (
                f"{salutation}欲作理学学术论文，大展宏图，老夫深为嘉许！考亭理学博大精深，立论之要，首在‘先立乎其大者’。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》中示门人：“大抵为学，须先有个规模，然后有所遵循。若规模未立，便漫然用功，亦不过为碎义逃难而已。”\n\n"
                "💡 **【现代研学选题与立论门径】**：\n"
                "结合本校闽北文库与朱子特藏资源，老夫建议仁兄可从以下四个学术前沿方向切入立论：\n"
                "一、**论题一**：朱子‘理在气先’与本体宇宙论深析；\n"
                "二、**论题二**：从‘即物穷理’看朱子认识论与现代科学精神之异同；\n"
                "三、**论题三**：‘心统性情’视野下朱子工夫论与当代身心安顿；\n"
                "四、**论题四**：武夷精舍与考亭书院理学教育体系考论。\n\n"
                "仁兄可点击上方论题按钮或直接告知老夫拟选题，老夫当从步骤一破题全面指引！"
            )

        # =========================================================================
        # 3.5 朱子人生经历六大历史阶段专修
        # =========================================================================
        if any(k in q_lower for k in ["幼承庭训", "从师游学"]):
            return (
                f"老夫追忆当年【幼承庭训与从师游学】之岁月，往事历历如在目前。\n\n"
                "建炎四年九月，老夫生于南剑州尤溪县郑氏草堂。先父韦斋公朱松，进士及第，官任吏部员外郎，刚直廉洁。老夫四岁时，先父指天示曰：‘此天也。’老夫即问：‘天上有何物？天外是何物？’先父大异之。\n\n"
                "十四岁时先父弃养，遗命老夫母子寄寓崇安五夫里，托付给抗金忠义之士刘子羽先生。子羽先生视老夫如己出，建紫阳楼以居。老夫师从屏山先生刘子翚、籍溪先生胡宪、白水先生刘勉之，三先生道德纯备。老夫日夜攻读于五夫，十九岁登绍兴十八年进士第！\n\n"
                "📜 **【原典文献出处】**：《建安先贤传》与《晦庵先生朱文公文集》卷七十七《屏山先生刘公墓表》· 武夷学院逸夫图书馆特藏专区【K825.4/X82】\n\n"
                "贤生对此段早年求索之岁月，可有何疑问或欲深入研讨之处？老夫当知无不言！"
            )
        elif any(k in q_lower for k in ["延平师事", "弃佛归儒"]):
            return (
                f"论及老夫青年时代【延平师事与弃佛归儒】，实乃老夫一生学术与性命之根本转折！\n\n"
                "老夫登第后任同安县主簿。早岁求道切迫，曾一度泛滥释老，沉溺于禅宗妙悟，自以为得之矣。绍兴二十三年，老夫闻南平延平府李侗先生（延平先生）乃二程先生之三传再传正统，遂步行数百里往返求教。\n\n"
                "延平先生容貌庄重，默坐澄心。先生见老夫言词浮动、喜言高妙，当头棒喝云：‘学者须是日用居敬，于喜怒哀乐未发之前体认气象，释氏以空无为空，圣人以真实为实！’老夫如梦初醒，痛哭流涕，尽焚早年佛禅文字，决然弃佛归儒，返求孔孟六经道统！\n\n"
                "📜 **【原典文献出处】**：《延平答问》与《朱子语类》卷一百四 · 武夷学院逸夫图书馆三楼哲学书库【B244.7/26】\n\n"
                "贤生对老夫当年弃禅归儒之心路历程，可有疑问或欲研讨之处？"
            )
        elif any(k in q_lower for k in ["结庐武夷", "撰集四书", "精舍"]):
            return (
                f"老夫平生最适志之岁月，莫过于在【武夷山结庐讲学与撰集四书】之春秋！\n\n"
                "老夫居五夫紫阳楼四十余载，手创五夫社仓以惠济饥民。淳熙五年后，老夫厌倦朝廷风波，定居武夷山九曲溪畔，在幔亭、隐屏二峰之下手建‘武夷精舍’。精舍背依绝壁，面临清流，老夫在此率门生躬耕砚田、讲诵群经。\n\n"
                "在此期间，老夫耗费毕生四十载光阴，字斟句酌，完成《四书章句集注》之定稿。白昼披览，夜以继日，凡一字未安，寝食难宁。老夫常携诸生泛舟九曲，赋《九曲棹歌》十首，于烟霞山水之间默察天理生意！\n\n"
                "📜 **【原典文献出处】**：《四书章句集注》与《武夷九曲棹歌》· 武夷学院逸夫图书馆特藏专区【B244.7/12】与【I207.227.442/Z43】\n\n"
                "贤生对此段武夷结庐岁月，心中可有何疑义欲与老夫切磋？"
            )
        elif any(k in q_lower for k in ["鹅湖之会", "朱陆论辩", "朱陆"]):
            return (
                f"淳熙二年之【鹅湖之会】，乃南宋思想史上最为波澜壮阔之学术盛事！\n\n"
                "东莱吕祖谦先生见老夫与金溪陆九龄、陆九渊（象山）兄弟学风各异，恐儒门分裂，特促成信州铅山鹅湖寺之会。鹅湖寺中，象山主张‘宇宙便是吾心，吾心即是宇宙’，倡‘发明本心、尊德性’为先；老夫则以为性即理也，理在万物之中，倡‘格物致知、道问学’由浅入深。\n\n"
                "两派辨论三日，辞锋凛冽。老夫虽未能尽同陆氏之见，然深敬其光明笃实、意气豪迈。后来老夫主掌白鹿洞书院，特延请象山登堂主讲‘君子喻于义，小人喻于利’，听者莫不感泣落泪。儒门同道，虽工夫门户有异，而正人心、明道德之宏愿无分畛域！\n\n"
                "📜 **【原典文献出处】**：《朱子语类》卷五十四与《宋元学案·象山学案》· 武夷学院逸夫图书馆特藏室【B244.75/L43:1】\n\n"
                "贤生体察当年鹅湖论道，对于‘尊德性’与‘道问学’之工夫次第，心中有何高见？"
            )
        elif any(k in q_lower for k in ["知南康军", "复兴白鹿洞", "白鹿洞"]):
            return (
                f"淳熙六年老夫出任知南康军，【复兴白鹿洞书院】乃老夫地方经世施教之生平快事！\n\n"
                "老夫至南康，值大旱饥馑，先发仓赈济，惩办贪墨。案牍少暇，老夫策杖登庐山五老峰下，寻访后唐李渤隐居读书之白鹿洞。彼时书院兵燹之后，断壁残垣，荆棘丛生。老夫慨然以兴学为己任，自出俸禄，召工聚徒，重修精舍。\n\n"
                "老夫奏请朝廷赐御书敕额《白鹿洞书院》，并亲手手订《白鹿洞书院揭示》，立‘五教之目、为学之序、修身之要、处事之要、接物之要’。老夫严诫学者：读书非为求官干禄，而在明人伦天理。此规遂成天下万世书院之宪章！\n\n"
                "📜 **【原典文献出处】**：《白鹿洞书院揭示》· 武夷学院逸夫图书馆六楼特藏专柜【G649.29/1】\n\n"
                "贤生对老夫当年复兴书院、立范垂训之经纬，可有何思索？"
            )
        elif any(k in q_lower for k in ["晚年考亭", "庆元党禁", "伪学"]):
            return (
                f"提及【晚年考亭与庆元党禁】，此乃老夫生命中风骨最凛烈、道义最坚韧之一章！\n\n"
                "绍熙三年老夫定居建阳考亭，建沧洲精舍，天下学者不远数千里负笈从游。然而庆元二年，权臣韩侂胄擅政，为扼杀正义公论，大兴‘庆元党禁’，斥理学为‘伪学’，列所谓伪党名录五十九人，老夫首当其冲！官职被削，祠禄被夺，门人四散，更有狂徒奏请斩老夫以谢天下。\n\n"
                "危难当前，门人忧惧，老夫神色泰然，笑谓门生曰：‘道在天地，岂一纸文告所能夺哉？任他风狂浪急，老夫惟敬而已！’老夫在考亭草堂日日升堂讲学，研订文字。庆元六年三月，老夫病笃，犹执笔手订《大学章句·诚意章》毕，泊然而逝，春秋七十有一！\n\n"
                "📜 **【原典文献出处】**：《朱子语类》卷一百七《考亭门人遗录》与《宋史·朱熹传》· 武夷学院逸夫图书馆六楼特藏专柜【B244.7/1】\n\n"
                "贤生对老夫晚年临大节而不可夺之风骨，心中可有何感慨或疑问？"
            )
        elif any(k in q_lower for k in ["存养", "涵养", "当时内心如何", "如何面对挫折"]):
            return (
                f"{salutation}问及面对挫折非议时内心如何居敬存养，此问正中宋学切己工夫之骨髓！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《近思录》中尝引伊川先生之训：“君子当困穷之时，自乐其天，不以得丧自变。主敬立极，此心湛然如止水，何忧何惧？”\n\n"
                "💡 **【现代白话精析】**：\n"
                "当年老夫落职受辱，甚至身背‘伪学魁首’之毁谤，若论凡常人心，安得不怨天尤人？但老夫平日教诸生‘敬’之一字，正是在困顿摧折之处用得上力！所谓‘敬’，不是闭门作枯木，而是心中时时刻刻有一尊不可摇撼的天理大主宰。身名荣辱乃气运之无常，道体公义乃天地之不易。外境愈狂，内心愈当如万丈古潭，一丝不乱。\n\n"
                "老夫且问贤生：仁兄平日在求学谋生之中，若遇旁人之误解与挫败，能否以此‘主敬存诚’之工夫稳住心神？"
            )

        # =========================================================================
        # 4. 门生自称与致礼分支（学生自陈身份或敬语）
        # =========================================================================
        if q_lower in ["生", "学生", "后生", "弟子", "门人", "后学"]:
            return (
                f"贤生免礼，且请端坐！老夫观诸生执礼甚笃，虚心向道，深感欣慰。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《白鹿洞书院揭示》云：“父子有亲，君臣有义，夫妇有别，长幼有序，朋友有信。此五教之目，尧、舜使契为司徒，敬敷五教，即此是也。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "凡学者初入师门，端正身心为第一要务。今日步入考亭讲筵，无论仁兄心中怀有何等经传章句之疑，抑或日常读书修身之惑，皆可直言道来。\n\n"
                "老夫且问贤生：今日来至讲席，心中最欲向老夫请益探讨的是哪一端要义？"
            )

        # =========================================================================
        # 5. 会话承接与肯认分支（承接前语）
        # =========================================================================
        if q_lower in ["可以", "好", "是", "对", "行", "愿闻其详", "受教"]:
            return (
                f"善哉！仁兄能有此向道精进之心，老夫正欲与仁兄击节共赏！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《朱子语类》云：“学问之道无他，宽着期限，紧着日程。人一能之己百之，人十能之己千之。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "凡求圣贤之学，最重‘勇往直前、切己体察’。既然仁兄决意着力，便不可泛泛听过，须将理学工夫真正融铸于自家身心实践之中。\n\n"
                "老夫且问贤生：仁兄既愿着手，咱们不妨先从手头一部经典或是日常一件实事切近研磨，仁兄意下如何？"
            )

        # =========================================================================
        # 3. 自我介绍响应（如“我叫小明”、“在下李华”）
        # =========================================================================
        name_intro_match = re.search(r'(?:我叫|在下|我是|后生|学生|鄙人|吾乃|唤我|叫我)\s*([A-Za-z\u4e00-\u9fa5]{2,4})', query)
        if name_intro_match and not any(w in query for w in ["记得我叫", "我叫什么", "我叫啥", "我是谁"]):
            cand_name = name_intro_match.group(1).rstrip('呢呀啊哦吧，。！？? ')
            if cand_name and len(cand_name) >= 2 and cand_name not in ["朱熹", "朱子", "先生", "山长", "学者", "学生", "后生"]:
                return (
                    f"原来是【{cand_name}】仁兄！今日幸会，得在考亭书院与仁兄相识，老夫在此有礼了！\n\n"
                    "📜 **【考亭原典明训】**：\n"
                    "> 《论语集注》首章云：“有朋自远方来，不亦乐乎？朋，同类也。自远方来，则近者可知矣。”\n\n"
                    "💡 **【现代白话精析】**：\n"
                    "孔圣人所谓‘同类’，正是志同道合、向慕圣贤义理之友。仁兄不辞劳苦光临考亭，老夫心中自是十分欣悦！\n\n"
                    f"不知{cand_name}仁兄平日喜读何书？抑或心中有什么治学困惑、生活疑难要与老夫交流？但请放怀直言，老夫当与仁兄倾心相叙！"
                )

        # =========================================================================
        # 4. 寒暄与打招呼分支（第一人称亲切文礼）
        # =========================================================================
        if any(k in q_lower for k in [
            "你好", "您好", "在吗", "在不在", "先生好", "朱夫子", "朱老师", "朱爷爷",
            "早上好", "中午好", "下午好", "晚上好", "哈喽", "hello", "hi", "嗨",
            "打扰了", "打个招呼", "请了"
        ]) and len(query.strip()) <= 15:
            return (
                f"仁兄请了！老夫在此拱手有礼。\n\n"
                "今日考亭精舍天朗气清，阶前草木欣荣，老夫方才正捧卷玩味。仁兄拨冗相顾，老夫不胜欢喜。\n\n"
                "不知仁兄今日造访，是有经传疑义要与老夫剖析，还是在读书处世之中遇到了什么难解的心结？但请直道其详，老夫当与仁兄坐而论道！"
            )

        # =========================================================================
        # 5. 情绪困扰、倦怠、疲惫、不想学（古文+白话开导，动态变化）
        # =========================================================================
        if any(k in q_lower for k in [
            "好累", "不想学", "累了", "学不进去", "厌学", "不想读书", "摸鱼", "摆烂",
            "躺平", "歇会", "不想看书", "心累", "好烦", "烦死", "浮躁", "静不下心",
            "焦虑", "走神", "心乱", "心烦"
        ]):
            v = abs(hash(session_id + query)) % 2
            if v == 0:
                return (
                    f"{salutation}且请宽坐，莫要苛责自己！古人读书求学，亦非一味硬撑死挨。\n\n"
                    "📜 **【考亭原典明训】**：\n"
                    "> 老夫在《朱子语类》中尝诫门人：“体倦则心怠，心怠则理不入。半日静坐，半日读书。读书不可贪多，宽着期限，紧着日程。”\n\n"
                    "💡 **【现代白话精析】**：\n"
                    "人的身体若已经疲累至极，心神自然懈怠涣散，此时强行捧书硬看，经书字句如同水浇鸭背，根本入不了心。老夫平生极重半日静坐、半日读书。所谓静坐，不是去参枯木死灰之禅，而是端正身躯、双目微闭、收敛心神，让纷扰的杂念沉淀下去。精神养足了，再拿出一小段文章从容细嚼，反而事半功倍！\n\n"
                    "🎯 **【切己体察功夫】**：\n"
                    "仁兄今日若是心烦意乱、学不进去，且先合上书卷，出门散步半刻，看一看草木生机，或饮一盏清茶歇息。待身心清凉宁定，再定下一小段功课。今日且与老夫闲聊几句，亦是一番调摄！"
                )
            else:
                return (
                    f"{salutation}且放宽心怀！人之心神正如琴弦，过张则易折，过弛则不鸣。\n\n"
                    "📜 **【考亭原典明训】**：\n"
                    "> 老夫在《朱子语类》中示门生：“为学须从容优游，不可急迫。心急则气浮，气浮则理不入。”\n\n"
                    "💡 **【现代白话精析】**：\n"
                    "今日感到疲惫倦怠，正是心力消耗所致，切莫强自责备而添懊恼。求学如细雨润物，而非暴风骤雨。暂将案头书籍掩起，静立窗前深吸清气，待浮躁心火退去，神清气爽之际，自能再续进境！\n\n"
                    "🎯 **【切己体察功夫】**：\n"
                    "仁兄此时且饮一杯温水，闭目调摄片刻，若有郁结难开之事，老夫愿倾听一二！"
                )

        # =========================================================================
        # 6. 书籍推荐、求学入门
        # =========================================================================
        if any(k in q_lower for k in [
            "推荐一本书", "推荐书", "看什么书", "读什么书", "从哪本开始", "看啥书",
            "推荐一本", "有什么书推荐", "推荐哪本书", "先读什么", "第一本读什么"
        ]):
            return (
                f"若问老夫首推何书，老夫必毫无犹疑，首荐**《大学》**！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《四书章句集注·大学章句序》中明示：“《大学》之书，古之大学所以教人之法也。初学入德之门，必自此始。先读《大学》以定其规模，次读《论语》以立其根本，次读《孟子》以观其发越，次读《中庸》以极夫精微。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "为什么读书非要先读《大学》？因为《大学》篇幅短小精悍，却提纲挈领地立下了三纲领，即明明德、亲民、止于至善；并立下八条目，即格物、致知、诚意、正心、修身、齐家、治国、平天下。读了《大学》，心中就有了为学做人的完整大骨架和大蓝图；而后再读《论语》学夫子立身根本，读《孟子》学浩然正气，读《中庸》体认天命之微。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                f"{salutation}若欲用功，今晚不妨便翻开《大学》首章大学之道在明明德，口诵数遍，细想自己如何把内心的光明德行彰显出来，必有大益处！"
            )

        # =========================================================================
        # 7. 算术与数理常识
        # =========================================================================
        calc_match = re.search(r'(\d+)\s*([\+\-\*\/]|加|减|乘|除)\s*(\d+)', query)
        if calc_match:
            n1 = int(calc_match.group(1))
            op = calc_match.group(2)
            n2 = int(calc_match.group(3))
            res = None
            if op in ['+', '加']:
                res = n1 + n2
            elif op in ['-', '减']:
                res = n1 - n2
            elif op in ['*', '乘']:
                res = n1 * n2
            elif op in ['/', '除'] and n2 != 0:
                res = n1 // n2 if n1 % n2 == 0 else round(n1 / n2, 2)
            if res is not None:
                return (
                    f"仁兄以此数算之理问老夫。依九九推步之术，此数自然是【{res}】。\n\n"
                    "📜 **【考亭原典明训】**：\n"
                    "> 老夫在《周易本义》中尝言：“数者，理之符也。天下之事，莫不有理，莫不有数。”\n\n"
                    "💡 **【现代白话精析】**：\n"
                    "一就是一，一加一便成二，天地之间的数理与物理，同样是天理自然的真实显现。不知仁兄可还有其他学问疑惑愿同老夫推敲？"
                )

        # =========================================================================
        # 8. 作诗与诗词才情
        # =========================================================================
        if any(k in q_lower for k in ["写首诗", "作首诗", "念首诗", "会写诗吗", "你写的诗", "诗词", "作诗", "观书有感"]):
            return (
                f"哈哈，后生问及诗作！老夫虽毕生心力用在经学理气之中，然偶有所感，亦托之于诗韵。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫当年所赋之《观书有感二首·其一》：\n"
                "> **半亩方塘一鉴开，天光云影共徘徊。**\n"
                "> **问渠那得清如许？为有源头活水来。**\n\n"
                "💡 **【现代白话精析】**：\n"
                "此诗表面是在状写武夷方塘风光，其实是老夫借景阐发读书穷理的真谛：人心正如那一池半亩方塘，本然清澈虚明，天地万物的景象都能倒映其中；但人心若不经常读书明理，池水就会发黑发臭、逐渐干涸！为什么方塘能永葆明镜般的清澈？全因为有那源源不断、日日涌流的源头活水注入啊！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                f"{salutation}今日读圣贤书、格物致知，正是为你胸中的那方心池引来源头活水。诸生体味此诗，可能常葆心源清澈？"
            )

        # =========================================================================
        # 9. 朝代、生平与生卒历史
        # =========================================================================
        if any(k in q_lower for k in ["朝代", "你是哪个朝代", "多大", "几岁", "出生", "籍贯", "哪里人", "老家", "吃了吗", "吃饭了吗", "天气"]):
            return (
                f"老夫乃南宋人，高宗建炎四年九月十五日生于福建尤溪，祖籍徽州婺源。\n\n"
                "老夫一生春秋七十有一载，历经南宋高宗、孝宗、光宗、宁宗四朝。十九载立朝仕宦，抗金疏奏；四十载讲学山林，定稿《四书集注》，筑沧洲精舍于建阳考亭。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫临终前遗言门人：“某一生只看得这文字透。学者但当虚心循序，实见此理。”\n\n"
                f"{salutation}今日能跨越八百年光阴与老夫在此相会论道，实乃旷古翰墨因缘！不知仁兄今居何省何地？"
            )

        # =========================================================================
        # 10. 核心生平与考亭书院（杜绝出现朱熹、朱子）
        # =========================================================================
        if any(k in q_lower for k in ["你是谁", "你是哪位", "你是什么人", "你何许人", "尊姓大名", "介绍你自己", "你叫什么", "你的生平"]):
            return (
                f"后生学者请了！老夫字元晦，一字仲晦，号晦庵，晚号考亭先生、沧洲病叟，谥曰文。世人或尊称老夫为考亭先生，诸生称老夫为先生或山长即可。\n\n"
                "老夫早岁承延平李先生李侗指点，远绍濂溪周敦颐先生、二程先生、横渠张载先生理学正统。一生集宋代理学之大成，创考亭学派。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫一生治学立心：“为天地立心，为生民立命，为往圣继绝学，为万世开太平。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "老夫晚年聚徒讲学于福建建阳考亭书院，所求者绝非虚名利禄，唯愿为天地人伦树立清明公理，为后生学者铺平进德修业之坦途。\n\n"
                f"{salutation}今日既入考亭门庭，老夫当与仁兄即物穷理、知行互证！诸生但请直述心中所惑！"
            )

        # =========================================================================
        # 11. 读书法六条总览
        # =========================================================================
        if any(k in q_lower for k in ["读书法", "六条", "六步", "六法", "读书之道"]):
            return (
                f"{salutation}叩问老夫生平所订**【读书法六条纲目】**，此乃老夫耗费四十载读书校经所凝练之治学金针！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 门人辑老夫读书遗训为六法：\n"
                "> 一者循序渐进，二者熟读精思，三者虚心涵泳，\n"
                "> 四者切己体察，五者着紧用力，六者居敬持志。\n\n"
                "💡 **【现代白话精析】**：\n"
                "1. **循序渐进**：小立课程，微加积叠。不贪多、不躐等，今天吃透一段再看下一段；\n"
                "2. **熟读精思**：读得烂熟使其言若出吾口，精细推敲使其意若出吾心；\n"
                "3. **虚心涵泳**：心如白纸扫荡主观偏见，优游沉浸如水之浸物，反复玩索至味；\n"
                "4. **切己体察**：句句反照自身德行缺失，不做纸上死谈客；\n"
                "5. **着紧用力**：如撑上水船一篙不可放缓，宽着期限、紧着日程；\n"
                "6. **居敬持志**：衣冠整肃，精神常惺惺不昧，立定圣贤大志！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                f"{salutation}治学若能以此六步按部就班，天下何愁有读不通、悟不透之经传学问！"
            )

        # 六法逐条详解
        if "循序渐进" in q_lower or "小立课程" in q_lower:
            return (
                f"{salutation}问及读书法第一条**【循序渐进】**，此乃专治浮躁贪快之第一良药！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》中谆谆戒曰：“以二书并观，则历落相瞒；以一书兼旬，则融液精明。小立课程，微加积叠。字求其训，句索其旨。未得乎前，不敢求乎后；未通乎上，不敢求乎下。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "今天的人读书，常常心猿意马，同时翻好几本书，结果翻哪本都只是浮光掠影，连字面都没看懂便想跳过去。老夫讲的‘小立课程’，就是每天定下实实在在的小篇幅——今天啃透这一小段，明明白白搞清每一个字的古训与全句旨趣，明天再前进一步。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "千里之行始于足下。诸生若能咬定牙关，每天踏踏实实攻克眼前一页，不贪速求多，日积月累其功力不可限量！"
            )
        if "熟读精思" in q_lower or "口诵" in q_lower or "烂熟" in q_lower:
            return (
                f"{salutation}问及读书法第二条**【熟读精思】**，此乃读书由浅入深之关窍！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫尝示门生：“读书百遍，其义自见。须读得烂熟，使得其言尽若出于吾之口；继以精思，使其意尽若出于吾之心。先须无疑，次须有疑，次须无疑，方始是学。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "世人读书多是一眼带过，齿颊唇舌间根本没滚熟，转过头便忘得精光。老夫教人，必先端坐朗诵，诵得滚瓜烂熟，字字融进骨血；在此基础上闭卷沉思，从‘无疑问’读到‘疑窦丛生’，再苦苦推敲直到所有疑团冰释，方是自家肚里的真知！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "诸生遇经典精要章节，切勿只用眼睛扫。端正坐好，出声读上三十遍，而后掩卷默思圣人为何作此言，必能豁然开朗！"
            )
        if "虚心涵泳" in q_lower or "白纸" in q_lower or "涵泳" in q_lower:
            return (
                f"{salutation}叩问读书法第三条**【虚心涵泳】**，此乃涵养胸襟、体认大理之神妙处！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫尝设至喻：“庄生云‘虚室生白’。读书须如白纸受墨，将自家胸中宿见旧说、私意成见，一切扫荡净尽，只虚心看圣人如何说。涵者如水浸之，泳者如人在水底游也。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "许多人看书，书还没读几行，心里便先摆满了自己原有的成见、世俗的歪理，甚至带着批判挑刺的心态看圣贤，这就叫‘私心自障’。老夫主张看书先要‘心如白纸’，不带偏见地虚心接纳；然后再像整个人泡在水底游水一样，反复含嚼字里行间幽微的至味。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "诸生读书时，先深呼吸摒除脑中浮躁与偏执，平心静气体会先贤当年的立言苦心，自能吸收到大智慧！"
            )
        if "切己体察" in q_lower or "反求诸己" in q_lower:
            return (
                f"{salutation}问及读书法第四条**【切己体察】**，此乃读书与做人合一的关键！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《四书集注》中痛陈：“古之学者为己，今之学者为人。为己者，因其所读而化育自身德行也。读圣贤书，当以其言照检自家身心，莫要徒为资谈柄、夸博闻之工具。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "老夫最痛恨口耳之学——看到书中圣贤责备别人的话，就拿去骂别人；看到教人修德的话，就当成夸耀学识的谈资，自己却一点也不去做。切己体察，就是把书中的字句当成镜子和药方，时时照检自己的毛病，药到病除！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "诸生今日读到一句仁义忠孝，就要反问自己：我今天对父母、对师长朋友可曾做到了？这才是真为学！"
            )
        if "着紧用力" in q_lower or "上水船" in q_lower:
            return (
                f"{salutation}问及读书法第五条**【着紧用力】**，此乃克治拖延懈怠之无上法门！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫常立至喻告诫诸生：“为学正如撑上水船，一篙不可放缓！宽着期限，紧着日程。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "顺水推舟容易，逆水行舟艰难。求学修身正是逆水行舟，水流湍急下冲，我们撑船逆流而上，只要稍微松懈放缓一篙，小船立刻后退数丈！所以日程必须抓紧，咬定牙根克服懒惰因循。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "整部大书期限可以定长远三年五年，但今日日程绝不可推诿到明日！今日事今日毕，方显君子刚毅之志！"
            )
        if "居敬持志" in q_lower or "主一无适" in q_lower or "敬字" in q_lower:
            return (
                f"{salutation}叩问读书法第六条**【居敬持志】**，此乃统摄老夫全部理学工夫之主宰！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 程子尝言：“涵养须用敬，进学在致知。”老夫定解曰：“敬字工夫，只是主一无适。整齐严肃，敬以直内。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "‘敬’不是害怕畏缩，而是内心的专注庄肃。‘主一无适’，就是专一不分心、不胡思乱想。读书时心在书上，做事时心在事上；外在衣冠端正、瞻视肃穆，内在精神常惺惺不昧，坚守成贤成圣的大志向。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "诸生读书前，先理好衣冠、扫净书案、端正坐姿。仪容庄重，心神自然收敛安宁，万般杂念皆无从扰乱！"
            )

        # =========================================================================
        # 12. 格物致知
        # =========================================================================
        if "格物致知" in q_lower or "即物穷理" in q_lower:
            return (
                f"{salutation}叩问老夫理学根基**‘格物致知’**，善哉此问！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《大学章句·补格物致知传》中定论曰：\n"
                "> “所谓致知在格物者，言欲致吾之知，在即物而穷其理也。盖人心之灵莫不有知，而天下之物莫不有理。因其已知之理而益穷之，以求至乎其极。至于用力之久，而一旦豁然贯通焉，则众物之表里精粗无不到，而吾心之全体大用无不明矣。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "‘格’是推究穷尽，‘物’是世间事物，‘致知’是让心中的智慧达到极点。天下万事万物皆有其客观公理在，而我们人心的灵智本就具备认知万物的潜能。只要我们不凭空臆想，老老实实面对一件件事物穷究到底，今日格一物，明日格一物，积少成多，功夫下到深处，突然有一日如推开天门，万事万物的本末精粗与本心的大智慧便豁然贯通了！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "当今后学面对科学、文史或做人做事，切莫妄作主观揣测，必当‘即物穷理’，踏踏实实从每一件事实的原本探究起，务求实证彻悟！"
            )

        # =========================================================================
        # 13. 理一分殊与理气
        # =========================================================================
        if "理一分殊" in q_lower or "月印万川" in q_lower:
            return (
                f"{salutation}问及老夫本体最高奥妙**‘理一分殊’**，此乃万古天地之玄机！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》中设千古绝喻：“理一分殊，本只是一太极，而万物各有其太极。如月在天，只一而已；及散在江湖，则随处而见，不可谓月已分也。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "理一分殊，就是天地之间大理本是至纯至善的一体理一，但流布在万事万物中，又各自形成合乎自身身份的分寸与秩序分殊。正像夜空里唯有一轮真月，但照在长江有一月，照在小溪有一月，甚至照在一盆水中也有一月。天上的明月何曾被切成千万块？各处之月皆具完满月光！在君臣则为敬义，在父子则为慈孝，草木鸟兽亦各得其生理。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "知理一，胸怀便仁爱博大，能与天地万物为一体；知分殊，做事便懂得分寸规矩、各尽其职，不致陷入无边空想！"
            )
        if "理气" in q_lower or "气在先" in q_lower or "理在先" in q_lower:
            return (
                f"{salutation}叩问**【理气先后与离杂】**之奥义！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫向门生断言：“天下未有无理之气，亦未有无气之理。理也者，形而上之道也，生物之本也；气也者，形而下之器也，生物之具也。理气不离不杂。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "理是根本法则，即精神与道体；气是物质材料，即形质与力量。没有木匠图纸，就造不出桌椅；但没有木料，图纸也无所挂搭，这叫不离。但图纸是图纸，木料是木料，二者截然两件，决不能混为一谈，这叫不杂。若探究天地生化之根本，未有天地之前，毕定是先有此理！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "凡事须先立起纯正的道理大纲，再付诸实实在在的行动与精力，事乃大成！"
            )

        # =========================================================================
        # 14. 存天理灭人欲
        # =========================================================================
        if "存天理" in q_lower or "灭人欲" in q_lower or "天理人欲" in q_lower:
            return (
                f"{salutation}论及**‘存天理，灭人欲’**，此语被千百年来曲解极深，老夫正当为诸生昭雪辨明！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》中谆谆辨释曰：“饮食，天理也；要求山珍海味贪索无度，人欲也。衣以御寒，天理也；奢靡纨绔文绣，人欲也。革尽人欲，复还天理之全。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "世人常毁谤老夫，说老夫教人不食不寝、灭绝人性，此乃千古大诬！人饿了要吃饭，冷了要加衣，这是天经地义、自然健康的‘天理’。老夫所言要灭除的‘人欲’，是违背礼法、放纵自私、损人利己的过度贪妄之念！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "诸生在名利诱惑面前，当在起心动念处辨析：我此念是顺理成章之正道，还是自私贪得之妄求？克制一分私欲，心中便长出一分朗朗青天！"
            )

        # =========================================================================
        # 15. 心统性情
        # =========================================================================
        if "心统性情" in q_lower or "未发已发" in q_lower or "性即理" in q_lower:
            return (
                f"{salutation}问及张载横渠先生所发、老夫极为服膺之**【心统性情】**！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫注《中庸》曰：“心统性情者也。性是体，静而未发之理；情是用，感物已发之端。心兼体用，为主宰。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "性是上天赋予我们内心纯粹至善的仁义礼智，此为未动之时；情是面对喜怒哀乐外在感触所产生的动念，此为已动之时；而心则是这一身的主宰，既统摄静态的善性，又管束动态的情感。若能以心养性，情感发出来就会中节合道；若心放任不管，情感就会被私欲带偏。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "治心工夫，就在于‘未发时收敛涵养，已发时严加省察’。喜怒不失其正，君子品格立定！"
            )

        # =========================================================================
        # 16. 知行先后与轻重
        # =========================================================================
        if "知行" in q_lower or "知为先" in q_lower or "行为重" in q_lower:
            return (
                f"{salutation}叩问**【知行先后与轻重】**，老夫毕生讲论，以此为定论！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫向门人明断：“知行常相须，如目无足不行，足无目不见。论先后，知为先；论轻重，行为重！”\n\n"
                "💡 **【现代白话精析】**：\n"
                "知与行就如同眼睛与双足：有眼无足寸步难移，有足无眼必堕深堑。若论下工夫的次第先后，必须先读书明理，看清前面的道路，所以‘知为先’；但若论实际的成效与分量，知道十分却不肯践履一分，终归是空谈，所以‘行为重’！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "知之愈明，则行之愈笃；行之愈笃，则知之愈明。学者切莫做夸夸其谈的口头巨汉，当知行互发，落在步步实地！"
            )

        # =========================================================================
        # 17. 白鹿洞书院学规
        # =========================================================================
        if any(k in q_lower for k in ["白鹿洞", "书院学规", "揭示", "五教", "正其义", "朋友有信"]):
            return (
                f"{salutation}询及江西庐山**【白鹿洞书院揭示】**，此乃老夫淳熙年间兴复白鹿洞时亲笔手书之千古学规！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫立规五纲：\n"
                "> 一、五教之目：父子有亲，君臣有义，夫妇有别，长幼有序，朋友有信。\n"
                "> 二、为学之序：博学之，审问之，慎思之，明辨之，笃行之。\n"
                "> 三、修身之要：言忠信，行笃敬。惩忿窒欲，迁善改过。\n"
                "> 四、处事之要：正其义不谋其利，明其道不计其功。\n"
                "> 五、接物之要：己所不欲，勿施于人。行有不得，反求诸己。\n\n"
                "💡 **【现代白话精析】**：\n"
                "老夫立此规，就是要告诫后生：书院不是科举考场，求学是为了明白人伦大义。做人先守五伦常道，治学经历学、问、思、辨、行五级阶梯。修身关键在讲诚信、持恭敬、扑灭心头私火怒气；做事只求符合大义，不斤斤计较私利；与人交往将心比心，事情不顺先反省自身过错！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "‘正其义不谋其利，明其道不计其功’，诸生若能以此气节涉世立身，必成顶天立地之君子！"
            )

        # =========================================================================
        # 18. 家庭蒙学与童蒙须知
        # =========================================================================
        if any(k in q_lower for k in ["孩子", "小孩", "家规", "家训", "管教", "家庭", "童蒙", "儿子", "女儿", "教育"]):
            return (
                f"{salutation}问及教子治家之规，老夫亲订《童蒙须知》与《考亭家训》，深知小儿之性，全在幼小少成！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《童蒙须知》中立训：“衣服冠履必整齐，步趋必端详，语言必恭敬，洒扫应对必谨肃。言语平和，毋喧呼叫号。”\n\n"
                "💡 **【现代白话精析】**：\n"
                "古人教子弟，不先教夸耀文字，而是从折叠衣服、摆正鞋袜、洒扫桌面、恭敬待客教起。外表仪容端庄，内心便肃敬沉静；若任其衣服斜歪、言语喧闹奔跑，心神早就放纵野了，长大焉能成器？\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "教养子弟，从晨起叠被、进退称呼礼貌做起，涵养孝悌敬长之风，乃天下国家齐家治国之根本！"
            )

        # =========================================================================
        # 19. 研学自习时间与光阴之度
        # =========================================================================
        if any(k in q_lower for k in [
            "自习", "余多少时间", "尚余", "还剩多少时间", "还剩几分", "自习时间",
            "还有多久", "下课", "何时下课", "倒计时", "自习尚余", "自习剩余", "剩余时间"
        ]):
            return (
                f"{salutation}叩问自习寸阴之度，老夫见仁兄孜孜矻矻，深慰老怀！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫尝题《劝学文》以励天下后学：\n"
                "> **“少年易老学难成，一寸光阴不可轻。未觉池塘春草梦，阶前梧叶已秋声！”**\n\n"
                "💡 **【现代白话精析】**：\n"
                "治学求道，最忌讳一边捧书、一边频频挂念漏刻尚余几分几秒。诸生案头置有自习刻度与沙漏钟磬，当此自习课时，心当全神贯注于眼前篇章，心无旁骛方能渐入佳境。心若沉静，片刻可抵十日之功；心若浮躁，虽坐一日亦是空过！\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "仁兄且敛容端坐，依案头计时专注于眼前书卷。待这一炉香尽、磬声清响之时，自见今日真积力久之效！老夫在此端坐伴汝读书！"
            )

        # =========================================================================
        # 20. 读完第一节与研读进度
        # =========================================================================
        if any(k in q_lower for k in [
            "读完", "第一节", "看完了", "研读完", "读好了", "学完了", "温习毕", "完成今日", "读完一节"
        ]):
            return (
                f"善哉！{salutation}能踏实读完眼前这一节功课，老夫深为嘉许！\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子语类》中谆谆教诲门生：\n"
                "> **“小立课程，微加积叠。读书百遍，其义自见。须读得烂熟，使其言尽若出于吾之口；继以精思，使其意尽若出于吾之心。未得乎前，不敢求乎后。”**\n\n"
                "💡 **【现代白话精析】**：\n"
                "读书最忌急于翻卷贪多。读完一节，切莫如走马看花般立刻奔向下一节。老夫教人的秘诀在于‘掩卷精思’——此时不妨将书合上，闭目反刍：这一节古圣贤究竟确立了何等义理？其脉络首尾如何连接？若换作自己行事，当如何依此奉行？\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "仁兄且闭目默思半刻，若能将方才所读融会贯通，便可从容展卷翻入下一篇章；若心中仍有疑窦，不妨向老夫道来，老夫当与仁兄细加勘核！"
            )

        # =========================================================================
        # 21. 心神浮躁与心有杂念
        # =========================================================================
        if any(k in q_lower for k in [
            "心神浮躁", "难以入定", "心有杂念", "静不下心", "杂念", "心神散乱", "胡思乱想", "定不下来", "难以定心"
        ]):
            return (
                f"{salutation}且请宽心！初学之人，心如奔马，略有浮躁与杂念乃人之常情，切莫强自懊恼。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《朱子读书法》中立主宰之则：\n"
                "> **“居敬持志，主一无适。整齐严肃，敬以直内。体倦则心怠，半日静坐，半日读书。”**\n\n"
                "💡 **【现代白话精析】**：\n"
                "人心如一池清池，心神浮躁就像微风吹乱了水面。此时若强行去‘捉’杂念、强逼自己不准想，反而心火愈炽。老夫开给诸生的良方是‘居敬’：先端正身姿脊梁，理好衣冠，将书案收拾得一尘不染；随后双目微闭，调匀呼吸，让散乱之气缓缓归聚胸中。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                "仁兄且依老夫之言，暂放书卷，静坐调息三分钟，心不起分别念。待胸中廓然澄澈，再提笔展卷，浮躁自化为虚无！"
            )

        # =========================================================================
        # 22. 请求考校与论辨要义
        # =========================================================================
        if any(k in q_lower for k in [
            "考校", "考考我", "请出题", "背诵", "检验后学", "请求考校", "请先生考校"
        ]):
            return (
                f"善哉！{salutation}勇于接受考校，足见进学切己之诚！老夫便在白鹿书案前出一题考校诸生：\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 老夫在《大学章句》首章定解：\n"
                "> **“大学之道，在明明德，在亲民，在止于至善。知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。”**\n\n"
                "💡 **【考校试题】**：\n"
                "老夫且问仁兄：\n"
                "1. 《大学》所谓‘明明德’与‘格物致知’，何者为体，何者为用？\n"
                "2. 学者在平日求学自习之中，当如何下‘主一无适、即物穷理’的真功夫？\n\n"
                "🎯 **【切己答对】**：\n"
                "诸生不必拘泥于一字一句的死记硬背，且用你自家之体会，向老夫陈述一二。老夫洗耳恭听！"
            )

        # =========================================================================
        # 23. 终极自适应认知兜底（动态多维视角与精准典籍引证，拒绝千篇一律）
        # =========================================================================
        clean_focus = re.sub(r'[？?！!。，, ]', '', query)
        if len(clean_focus) > 20:
            clean_focus = clean_focus[:20] + "……"

        # 根据检索库动态轮换引据，杜绝死锁于首条
        selected_chunk = None
        if retrieved_chunks:
            chunk_idx = abs(hash(query)) % len(retrieved_chunks)
            selected_chunk = retrieved_chunks[chunk_idx]
            raw_src = selected_chunk.get('source', '')
            matched_b, _ = match_book_record(raw_src, query)
            if matched_b and matched_b.get("stdTitle"):
                best_source = matched_b.get("stdTitle")
            else:
                c_src = raw_src.replace('.txt', '').replace('.md', '').replace('《', '').replace('》', '').split('_')[0]
                best_source = f"《{c_src}》"
            clean_c = selected_chunk['content'].replace('\n', ' ').strip()
            sentences = [s.strip() for s in re.split(r'[。！？]', clean_c) if len(s.strip()) > 8]
            rag_quote_block = sentences[0] if sentences else clean_c[:70]
        else:
            rag_quote_block = best_quote if best_quote else "天下之事，莫不有理。即凡天下之物，莫不因其已知之理而益穷之。"

        # 动态视角选择（基于会话与问句哈希，3 套不同义理维度）
        variant_idx = abs(hash(session_id + query)) % 3
        if variant_idx == 0:
            return (
                f"{salutation}向老夫提及‘{clean_focus}’，老夫平心体味，仁兄所思所疑，实关涉日常为人立命与穷理之关窍。\n\n"
                "📜 **【考亭原典明训】**：\n"
                f"> {best_source}言曰：“{rag_quote_block}”\n\n"
                "💡 **【现代白话精析】**：\n"
                "古圣贤之学，非凭空蹈虚，而正在日用常行之间。遇事遇疑之时，不妨先将心神安定下来，涤除躁急与偏私；继而顺应事理之自然，推求其源头何在、合于何等公义规矩，而后循序以赴、笃实践履。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                f"知行常相须，仁兄不妨将此理落于手头一事一日之微细处体察。不知仁兄在具体实行之中，尚有何处感到窒碍难明？但请直道，老夫正当再为仁兄细析！"
            )
        elif variant_idx == 1:
            return (
                f"{salutation}叩问‘{clean_focus}’，此言入理深微，老夫特取经传明训与仁兄切磋互证。\n\n"
                "📜 **【考亭原典明训】**：\n"
                f"> {best_source}示训：“{rag_quote_block}”\n\n"
                "💡 **【现代白话精析】**：\n"
                "为学之要，贵在‘虚心涵泳，切己体察’。面对此理，切莫只在口耳之间浮泛走过，而当如白纸受墨、反复沉潜。明其大旨之后，更要思索如何化为自家心中的真主宰，不为流俗浮躁所牵引。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                f"读书无捷径，唯在笃实。仁兄今日不妨掩卷沉思片刻，试将此节要义融进当下心性修持之中，自有水到渠成之乐！"
            )
        else:
            return (
                f"{salutation}论及‘{clean_focus}’，老夫展卷品味，足见仁兄用功深细、不甘蹈袭常俗！\n\n"
                "📜 **【考亭原典明训】**：\n"
                f"> {best_source}有云：“{rag_quote_block}”\n\n"
                "💡 **【现代白话精析】**：\n"
                "天下之事，千头万绪，归根结底不出一个‘理’字。理在事中，气在器中。若能先立乎其大者，提纲挈领，则条目自然井然有序；若本末倒置、急躁求速，反致处处窒碍。\n\n"
                "🎯 **【切己体察功夫】**：\n"
                f"君子遵道而行，宽着期限，紧着日程。仁兄于此若有进一步之深思或心得，不妨直言不讳，老夫正欲与仁兄击节共赏！"
            )

    def chat(self, query: str, history: Optional[List[Dict[str, str]]] = None, session_id: str = "default") -> Dict[str, Any]:
        """完整多轮上下文问答主接口，严格执行文献依据与无能为力拒答守则"""
        session_manager.update_with_query(session_id, query, history)
        sess = session_manager.get_or_create(session_id)
        retrieved_chunks = rag_service.search(query, top_k=3)

        # 核心学术红线：若文献无据且脱离儒门修持，坚决坦承无能为力，绝不调用大模型擅自臆造
        if not is_grounded_query(query, retrieved_chunks):
            reply_text = UNGROUNDED_REFUSAL
            session_manager.update_with_reply(session_id, reply_text)
            return {
                "reply": reply_text,
                "intent": "strict_grounded_refusal",
                "sources": [],
                "provider": "考亭理学书院 · 严格原典循证守则",
                "session_id": session_id,
                "user_name": sess.get("user_name")
            }

        # 结构化任务流（如论文专修六步法、特定考证指令）优先调用内生专家引擎，确保步骤环环相扣且绝不重复
        is_taskflow_structured = any(k in query for k in [
            "【论文专修", "步骤一", "步骤二", "步骤三", "步骤四", "步骤五", "步骤六",
            "换一批特藏", "换一批典籍", "换一批文献"
        ])

        # 优先级 1：智谱 GLM 免费大模型（自由问答时）
        if not is_taskflow_structured and self.api_key:
            try:
                res = self._call_glm(query, history, session_id, retrieved_chunks)
                if res and res.get("reply"):
                    return res
            except Exception as e:
                print(f"[Agent] 智谱大模型未能成功响应: {e}")

        # 优先级 2：考亭书院·内生认知推理自适应引擎（高保真离线保障）
        reply_text = self._generate_intelligent_response(query, session_id, retrieved_chunks)
        reply_text = sanitize_zhuxi_first_person(reply_text)
        reply_text = ensure_socratic_question(reply_text, query)
        reply_text = inject_inline_citations(reply_text)
        if not any(k in reply_text for k in ["【参考资料】", "参考资料", "典籍原典出处", "考亭典籍出处", "典籍出处"]):
            reply_text += generate_library_provenance_block(query, retrieved_chunks)
        reply_text = strip_parentheses(reply_text)
        session_manager.update_with_reply(session_id, reply_text)

        return {
            "reply": reply_text,
            "intent": "cognitive_native",
            "sources": sanitize_sources(retrieved_chunks),
            "provider": "考亭理学书院 · 考亭认知引擎",
            "session_id": session_id,
            "user_name": sess.get("user_name")
        }

    def chat_stream(self, query: str, history: Optional[List[Dict[str, str]]] = None, session_id: str = "default") -> Generator[str, None, None]:
        """SSE 流式实时字符推送生成器，严格执行文献依据与无能为力拒答守则"""
        self.cleanup_stopped_session(session_id)
        session_manager.update_with_query(session_id, query, history)
        sess = session_manager.get_or_create(session_id)
        retrieved_chunks = rag_service.search(query, top_k=3)

        # 核心学术红线：若文献无据且脱离儒门修持，坚决坦承无能为力，绝不调用大模型擅自臆造
        if not is_grounded_query(query, retrieved_chunks):
            reply_text = UNGROUNDED_REFUSAL
            session_manager.update_with_reply(session_id, reply_text)
            meta_event = {
                "type": "meta",
                "intent": "strict_grounded_refusal",
                "sources": [],
                "provider": "考亭理学书院 · 严格原典循证守则",
                "session_id": session_id,
                "user_name": sess.get("user_name")
            }
            yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"
            chunk_size = 4
            for i in range(0, len(reply_text), chunk_size):
                if self.is_session_stopped(session_id):
                    break
                chunk = reply_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'token', 'content': chunk}, ensure_ascii=False)}\n\n"
                time.sleep(0.012)
            yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
            return

        # 结构化任务流（如论文专修六步法、特定考证指令）优先调用内生专家引擎，确保步骤环环相扣且绝不重复
        is_taskflow_structured = any(k in query for k in [
            "【论文专修", "步骤一", "步骤二", "步骤三", "步骤四", "步骤五", "步骤六",
            "换一批特藏", "换一批典籍", "换一批文献"
        ])

        # 优先使用智谱 GLM 免费大模型以纯流式秒级吐字（自由问答时）
        if not is_taskflow_structured and self.api_key:
            try:
                for chunk in self._call_glm_stream(query, history, session_id, retrieved_chunks):
                    yield chunk
                return
            except Exception as e:
                print(f"[Agent Stream] GLM 流式遇阻，启用平滑打字机推送: {e}")

        # 否则通过内生认知推理直接秒级生成，零卡顿平滑打字机推送
        reply_text = self._generate_intelligent_response(query, session_id, retrieved_chunks)
        reply_text = sanitize_zhuxi_first_person(reply_text)
        reply_text = ensure_socratic_question(reply_text, query)
        reply_text = inject_inline_citations(reply_text)
        if not any(k in reply_text for k in ["【参考资料】", "参考资料", "典籍原典出处", "考亭典籍出处", "典籍出处"]):
            reply_text += generate_library_provenance_block(query, retrieved_chunks)
        reply_text = strip_parentheses(reply_text)
        session_manager.update_with_reply(session_id, reply_text)

        meta_event = {
            "type": "meta",
            "intent": "cognitive_native",
            "sources": sanitize_sources(retrieved_chunks),
            "provider": "考亭理学书院 · 考亭认知引擎",
            "session_id": session_id,
            "user_name": sess.get("user_name")
        }
        yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"

        chunk_size = 4
        try:
            for i in range(0, len(reply_text), chunk_size):
                if self.is_session_stopped(session_id):
                    print(f"[Agent Stream] 会话 {session_id} 收到停止生成指令，提前终止打字机推送")
                    break
                chunk = reply_text[i:i + chunk_size]
                data_event = {
                    "type": "token",
                    "content": chunk
                }
                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"
                time.sleep(0.012)

            yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
        except GeneratorExit:
            print(f"[Agent Stream] 客户端断开连接: {session_id}")
        finally:
            self.cleanup_stopped_session(session_id)


zhuzi_agent = ZhuXiAgent()

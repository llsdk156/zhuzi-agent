# -*- coding: utf-8 -*-
"""
考亭研撰 · 朱子文化学术论文指导与导出核心服务
涵盖：
1. 朱子文化领域校验与智能拟题
2. 武夷学院逸夫图书馆 23 部特藏 RAG + OPAC 动态引文检索与 GB/T 7714-2015 格式化
3. 三级结构化大纲生成与容错解析
4. 分章正文 SSE 流式起草 / 学术润色 / 原典考据增补 / 论证逻辑诊断
5. 五维学术体检审稿与互动式模拟答辩
6. Word (.docx 完整论文版 / 开题报告书版) 与 Markdown (.md) 规范文档导出

全链路严禁输出任何 emoji 图标，坚守宋版典籍与高校学术论文严谨排版规范。
"""

import hashlib
import io
import json
import os
import re
import time
from typing import Any, Dict, Generator, List, Optional, Tuple

from core.agent_engine import (
    clean_system_notes,
    match_book_record,
    sanitize_zhuxi_first_person,
    zhuzi_agent,
)
from core.opac_service import opac_service
from core.prompt_templates import (
    THESIS_DEFENSE_PROMPT,
    THESIS_DRAFT_ASSIST_PROMPT,
    THESIS_OUTLINE_PROMPT,
    THESIS_REVIEW_PROMPT,
    THESIS_TOPIC_PROMPT,
)
from rag.rag_service import rag_service

try:
    import docx
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt, RGBColor

    HAS_PYTHON_DOCX = True
except ImportError:
    HAS_PYTHON_DOCX = False


# ==========================================
# 1. 零表情图标净化与朱子文化领域校验
# ==========================================

_EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002600-\U000027BF"
    "\U0000FE0F"
    "\U0000200D"
    "]+",
    flags=re.UNICODE,
)

_ZHUXI_THESIS_KEYWORDS = (
    "朱子", "朱熹", "考亭", "武夷", "晦庵", "紫阳", "文公", "闽学", "闽北",
    "理学", "道学", "宋明理学", "程朱", "二程", "程颐", "程颢", "周敦颐",
    "张载", "邵雍", "陆九渊", "鹅湖", "阳明", "王阳明", "心学", "戴震",
    "四书", "大学", "中庸", "论语", "孟子", "近思录", "语类", "文集",
    "诗集传", "周易本义", "楚辞集注", "通鉴纲目", "童蒙须知", "小学",
    "白鹿洞", "书院", "精舍", "学规", "社仓", "五夫", "政和", "建阳", "尤溪",
    "家礼", "家训", "家风", "宗族", "礼教", "礼学", "祭礼",
    "格物", "致知", "穷理", "理气", "理一分殊", "太极", "无极", "天理", "人欲",
    "心性", "心统性情", "居敬", "持敬", "主敬", "涵养", "省察", "慎独", "诚意",
    "正心", "修身", "齐家", "治国", "平天下", "知行", "读书法", "读书六法",
    "儒学", "儒家", "经学", "国学", "宋代", "宋学", "南宋", "传统", "古籍",
    "观书有感", "九曲", "棹歌", "茶理", "山水", "诗学", "诗词", "东亚", "海外",
)

_OFF_TOPIC_THESIS_RE = re.compile(
    r'(?:python|java|javascript|c\+\+|react|vue|docker|kubernetes|mysql|redis|'
    r'深度学习|机器学习|神经网络|股票预测|量化交易|加密货币|比特币|王者荣耀|原神|'
    r'外卖配送|奶茶配方|汽车发动机|光伏逆变器|芯片光刻|半导体封装)',
    re.IGNORECASE,
)


def strip_emojis(text: str) -> str:
    """清除所有 emoji 与装饰性图形符号，确保学术文本纯净"""
    if not text:
        return ""
    cleaned = _EMOJI_RE.sub("", str(text))
    cleaned = re.sub(r'[ \t]{2,}', ' ', cleaned)
    return cleaned


def is_zhuxi_thesis_topic(text: str) -> bool:
    """判定题目或关键词是否围绕朱子文化、理学及传统文化研学"""
    q = (text or "").strip()
    if not q:
        return True
    if any(k in q for k in _ZHUXI_THESIS_KEYWORDS):
        return True
    if _OFF_TOPIC_THESIS_RE.search(q):
        return False
    # 若能在武夷特藏知识库检索到显著匹配也放行
    hits = rag_service.search(q, top_k=2)
    return bool(hits and hits[0].get("score", 0) >= 6.0)


def _extract_json_object(raw: str) -> Optional[Dict[str, Any]]:
    """容错解析模型输出的 JSON 文本"""
    if not raw:
        return None
    s = raw.strip()
    fence = re.search(r'```(?:json)?\s*([\s\S]*?)```', s, re.IGNORECASE)
    if fence:
        s = fence.group(1).strip()
    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(s[start : end + 1])
    except Exception:
        return None


def _get_chat_endpoint() -> str:
    base = (getattr(zhuzi_agent, "api_base_url", "") or "https://open.bigmodel.cn/api/paas/v4").rstrip("/")
    return base if base.endswith("/chat/completions") else f"{base}/chat/completions"


def _call_thesis_llm(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.55,
    max_tokens: int = 2400,
    timeout: float = 42.0,
) -> str:
    """复用全局 httpx 连接池与配置调用大模型"""
    if not zhuzi_agent.api_key or not zhuzi_agent._http_client:
        raise RuntimeError("未配置云端大模型 API Key")
    headers = {
        "Authorization": f"Bearer {zhuzi_agent.api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": getattr(zhuzi_agent, "llm_model", "glm-4-flash"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    resp = zhuzi_agent._http_client.post(
        _get_chat_endpoint(),
        headers=headers,
        json=payload,
        timeout=timeout,
    )
    resp.raise_for_status()
    data = resp.json()
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    return strip_emojis(clean_system_notes(content))


# ==========================================
# 2. 典籍引用与 GB/T 7714-2015 格式化
# ==========================================

_ANCIENT_PUB_DEFAULTS: Dict[str, Tuple[str, str, str]] = {
    "sishu": ("朱熹", "北京: 中华书局", "2011"),
    "daxue": ("朱熹", "北京: 中华书局", "2011"),
    "zhongyong": ("朱熹", "北京: 中华书局", "2011"),
    "lunyu": ("朱熹", "北京: 中华书局", "2011"),
    "mengzi": ("朱熹", "北京: 中华书局", "2011"),
    "yulei": ("黎靖德, 编", "北京: 中华书局", "1986"),
    "jinsi": ("朱熹, 吕祖谦, 编", "上海: 上海古籍出版社", "2014"),
    "huian": ("朱熹", "上海: 上海古籍出版社", "2002"),
    "taiji": ("周敦颐, 著; 朱熹, 解", "北京: 中华书局", "2009"),
    "ximing": ("张载, 著; 朱熹, 解", "北京: 中华书局", "2006"),
    "zhouyi": ("朱熹", "北京: 中华书局", "2009"),
    "shijizhuan": ("朱熹", "上海: 上海古籍出版社", "2011"),
    "chuci": ("朱熹", "上海: 上海古籍出版社", "2001"),
    "gangmu": ("朱熹", "北京: 中华书局", "2015"),
    "tongmeng": ("朱熹", "北京: 中华书局", "2016"),
    "xuegui": ("朱熹", "上海: 上海古籍出版社", "2002"),
}


def format_gbt7714(
    book_title: str,
    author: str = "",
    publisher: str = "",
    year: str = "",
    book_key: str = "",
    doc_type: str = "M",
) -> str:
    """生成符合 GB/T 7714-2015 规范的中文参考文献条目"""
    clean_title = strip_emojis(book_title or "朱子理学特藏典籍").strip().strip("《》")
    clean_author = strip_emojis(author or "").strip()
    clean_pub = strip_emojis(publisher or "").strip()
    clean_year = strip_emojis(year or "").strip()

    # 清洗形如“宋·朱熹 著 · 中华书局典藏版”或“编著”冗余词
    if book_key in _ANCIENT_PUB_DEFAULTS:
        def_author, def_pub, def_year = _ANCIENT_PUB_DEFAULTS[book_key]
        if not clean_author or "·" in clean_author:
            clean_author = def_author
        if not clean_pub or len(clean_pub) <= 2:
            clean_pub = def_pub
        if not clean_year:
            clean_year = def_year
    else:
        clean_author = re.sub(r'^(?:南宋|宋|明|清)[·\.\s]+', '', clean_author)
        clean_author = re.split(r'[·\|]', clean_author)[0].strip()
        clean_author = re.sub(r'\s*(?:著|撰|编注|撰定|章句|集注)$', '', clean_author).strip()
        if not clean_author:
            clean_author = "武夷学院朱子学研究中心"
        if not clean_pub or len(clean_pub) <= 2:
            clean_pub = "武夷学院逸夫图书馆特藏本"

    pub_part = clean_pub
    if clean_year and clean_year not in pub_part:
        pub_part = f"{pub_part}, {clean_year}"
    return f"{clean_author}. {clean_title}[{doc_type}]. {pub_part}."


def _clean_corpus_excerpt(raw_content: str, max_len: int = 210) -> Tuple[str, str]:
    """提取原典切片中的标题与纯净正文引句"""
    text = re.sub(r'\[\s*编辑\s*\]', '', raw_content or "")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    chapter = ""
    body_lines: List[str] = []
    for ln in lines:
        if ln.startswith("#"):
            if not chapter:
                chapter = ln.lstrip("#").strip()
            continue
        if ln.startswith(("【著述】", "【出版", "【来源", "---")):
            continue
        body_lines.append(ln)
    body = " ".join(body_lines)
    body = re.sub(r'\s+', ' ', body).strip()
    if len(body) > max_len:
        cut = body[:max_len]
        for sep in ("。", "！", "？", "；"):
            pos = cut.rfind(sep)
            if pos >= max_len // 2:
                cut = cut[: pos + 1]
                break
        body = cut.rstrip("，、；：")
    return strip_emojis(chapter or "核心章句"), strip_emojis(body)


def search_library_citations(topic: str, query: str = "", top_k: int = 6) -> List[Dict[str, Any]]:
    """根据论文题目与关键词实时联动 RAG（23部典籍）与 OPAC（24部馆藏）检索真实引文"""
    combined = f"{topic or ''} {query or ''}".strip()
    if not combined:
        combined = "朱子 理学 格物致知 读书法 武夷精舍"

    raw_hits = rag_service.search(combined, top_k=max(top_k * 2, 10))
    results: List[Dict[str, Any]] = []
    seen_fingerprints = set()
    source_counts: Dict[str, int] = {}

    for chunk in raw_hits:
        src_name = chunk.get("source", "")
        chunk_title = chunk.get("title", "")
        content = chunk.get("content", "")
        chapter, excerpt = _clean_corpus_excerpt(content)
        if len(excerpt) < 18:
            continue

        fp = hashlib.md5(f"{src_name}:{excerpt[:48]}".encode("utf-8")).hexdigest()[:10]
        if fp in seen_fingerprints:
            continue

        # 限制单部典籍最多出现 2 条，确保引文分布多元
        if source_counts.get(src_name, 0) >= 2:
            continue

        matched_rec, matched_key = match_book_record(src_name, f"{chunk_title} {excerpt[:40]}")
        book_key = matched_key or "yulei"
        live = opac_service.get_live_book_status(book_key, force=False)

        book_title = (live.get("title") or (matched_rec.get("title") if matched_rec else "") or src_name).strip()
        book_title = book_title.replace(".txt", "").replace(".md", "").strip()
        if not book_title.startswith("《"):
            book_title = f"《{book_title}》"

        author = live.get("author") or (matched_rec.get("author") if matched_rec else "宋·朱熹")
        publisher = live.get("publisher") or ""
        call_number = live.get("callNumber") or (matched_rec.get("callNumber") if matched_rec else "B244.71/L42")
        location = live.get("location") or (matched_rec.get("location") if matched_rec else "逸夫图书馆特藏室")
        status = live.get("status") or "馆藏在架"
        detail_url = live.get("detailUrl") or ""

        gbt = format_gbt7714(
            book_title=book_title,
            author=author,
            publisher=publisher,
            book_key=book_key,
        )

        seen_fingerprints.add(fp)
        source_counts[src_name] = source_counts.get(src_name, 0) + 1

        results.append({
            "id": f"cit_{fp}",
            "book_key": book_key,
            "book_title": strip_emojis(book_title),
            "author": strip_emojis(author),
            "call_number": call_number,
            "location": strip_emojis(location),
            "status": strip_emojis(status),
            "detail_url": detail_url,
            "filename": src_name,
            "chapter": chapter if chapter != "核心章句" else (chunk_title or "原文选段"),
            "quote": excerpt,
            "gbt7714": gbt,
            "score": round(float(chunk.get("score", 0.0)), 2),
        })
        if len(results) >= top_k:
            break

    return results


# ==========================================
# 3. 朱子文化智能选题推荐
# ==========================================

_CURATED_ZHUXI_TOPICS: List[Dict[str, Any]] = [
    {
        "title": "论朱熹“格物致知”工夫论的义理脉络与当代大学通识教育价值",
        "angle": "认识论与书院教育",
        "problem": "厘清朱子“即物穷理”如何贯通知识探求与德性涵养，回应将格物简单等同于实证科学或脱离现实的片面解读。",
        "primary_sources": ["《四书章句集注·大学章句》", "《朱子语类》卷十"],
        "innovation": "结合武夷学院逸夫图书馆特藏文献，构建“穷理—涵养—践履”三维通识育人框架。",
        "tags": ["格物", "大学", "教育", "读书", "通识", "认识论"],
    },
    {
        "title": "理一分殊与月印万川：朱熹本体宇宙论及其生态伦理意蕴考论",
        "angle": "本体哲学与生态转化",
        "problem": "剖析“理不离气、亦不杂气”的逻辑结构，阐发朱子民胞物与思想对当代武夷生态文明建设的哲理启示。",
        "primary_sources": ["《朱子语类》卷一", "《太极图说解》", "《西铭解》"],
        "innovation": "从“理一分殊”切入武夷山水生态文化，打通宋代理学本体论与现代生态伦理对话。",
        "tags": ["理气", "太极", "理一分殊", "生态", "哲学", "本体", "山水"],
    },
    {
        "title": "武夷精舍与考亭书院讲学规制考——兼论《白鹿洞书院揭示》的育人范式",
        "angle": "书院史与闽学传统",
        "problem": "考察朱子在武夷隐屏与建阳考亭的聚徒讲学实践，揭示其如何以学规塑立人格、以问难启发思辨。",
        "primary_sources": ["《白鹿洞书院学规》", "《晦庵先生朱文公文集》", "《朝圣朱子》"],
        "innovation": "立足闽北在地空间史料，还原武夷精舍空间布局与书院精神建构的内在关联。",
        "tags": ["书院", "武夷", "考亭", "白鹿洞", "教育", "闽北", "学规"],
    },
    {
        "title": "从“五夫社仓”看朱熹经世实学思想与古代基层社会治理智慧",
        "angle": "经世实学与基层治理",
        "problem": "打破“理学空谈心性、不切实用”的刻板印象，以崇安五夫社仓制度实证朱子义利兼通的民生担当。",
        "primary_sources": ["《晦庵先生朱文公文集》", "《朝圣朱子》", "《朱子三代与政和》"],
        "innovation": "从制度经济学与乡约自治视角剖析社仓敛散机制，提炼基层互助治理的历史镜鉴。",
        "tags": ["社仓", "五夫", "治理", "经世", "民生", "政和", "家风"],
    },
    {
        "title": "“心统性情”视域下朱熹居敬涵养工夫与当代青年身心安顿研究",
        "angle": "心性哲学与现代修身",
        "problem": "辨析天命之性与气质之性、已发与未发之关系，探求“主敬存诚”对缓解当代学子浮躁焦虑的实践路径。",
        "primary_sources": ["《四书章句集注·中庸章句》", "《近思录》", "《朱子语类》"],
        "innovation": "将“中和新说”转化为可操作的日用省察步骤，回应青年心理调适与人格养成课题。",
        "tags": ["心性", "心统性情", "修身", "居敬", "涵养", "心理", "青年", "中庸"],
    },
    {
        "title": "以诗载道与理学意境：朱熹武夷山水诗《九曲棹歌》《观书有感》审美哲思探微",
        "angle": "朱子诗学与美学",
        "problem": "辨析理趣与诗境的张力，阐明朱熹如何在武夷九曲与方塘活水意象中融摄“循序渐进、源头活水”之理。",
        "primary_sources": ["《武夷九曲棹歌与精舍杂咏》", "《朱子的诗和远方》", "《诗集传》"],
        "innovation": "结合《朱子的诗和远方》闽北特色专著，系统梳理朱子山水诗中“即景见理”的审美结构。",
        "tags": ["诗", "诗词", "九曲", "观书有感", "美学", "文学", "山水", "诗集传"],
    },
    {
        "title": "朱子文化在东亚与海外的传播谱系及其跨文明对话路径研究",
        "angle": "国际传播与文化互鉴",
        "problem": "梳理朱子学东渐朝鲜半岛、日本及西传欧洲的历史脉络，探讨当代数字媒体语境下朱子文化的国际表达。",
        "primary_sources": ["《朱子文化在海外》", "《世纪之交的朱子学》", "《第二届考亭论坛专辑》"],
        "innovation": "综合本校国际朱子学特藏文献，提炼“经典译介+在地阐释+数字活化”的传播模型。",
        "tags": ["海外", "东亚", "传播", "国际", "数字", "当代", "新媒体", "论坛"],
    },
]


def suggest_topics(
    keyword: str = "",
    thesis_type: str = "本科毕业论文",
    discipline: str = "朱子理学与哲学",
) -> Dict[str, Any]:
    """智能拟定 5 个朱子文化学术选题"""
    kw = strip_emojis(keyword or "").strip()
    if kw and not is_zhuxi_thesis_topic(kw):
        return {
            "accepted": False,
            "message": (
                f"老夫细审“{kw}”一题，似偏离朱子文化与武夷理学特藏范畴。"
                "本研撰台专以朱熹理学、四书经义、武夷书院教育、五夫社仓实学、闽北家风诗学及朱子文化当代转化为宗。"
                "请补充朱子文化切入点，例如将您的兴趣与“朱子格物致知”“白鹿洞书院教育”“朱子文化数字传播”等主题相结合。"
            ),
            "topics": [
                {k: v for k, v in item.items() if k != "tags"}
                for item in _CURATED_ZHUXI_TOPICS[:5]
            ],
            "mentor_note": "治学须先定准门户。以上五题皆立足武夷学院逸夫图书馆特藏典籍，贤生可择一立题，或添入朱子文化关键词再行拟题。",
            "fallback": False,
        }

    # 优先调用云端大模型结合知识库定制
    rag_hits = rag_service.search(kw or discipline or "朱子 理学", top_k=3)
    rag_sources = [h.get("source", "").replace(".txt", "") for h in rag_hits if h.get("source")]
    user_prompt = (
        f"论文类型：{thesis_type}\n"
        f"研究方向/学科视角：{discipline}\n"
        f"学者兴趣关键词：{kw or '朱子文化与武夷理学特藏综合研究'}\n"
        f"本校逸夫图书馆相关特藏参考：{', '.join(rag_sources) or '《四书章句集注》《朱子语类》《近思录》'}\n"
        "请严格围绕朱子文化拟定 5 个学术选题，按要求的 JSON 格式输出。"
    )

    try:
        raw = _call_thesis_llm(THESIS_TOPIC_PROMPT, user_prompt, temperature=0.65, max_tokens=1600, timeout=30.0)
        parsed = _extract_json_object(raw)
        if parsed and isinstance(parsed.get("topics"), list) and len(parsed["topics"]) >= 3:
            clean_topics = []
            for t in parsed["topics"][:5]:
                if not isinstance(t, dict) or not t.get("title"):
                    continue
                clean_topics.append({
                    "title": strip_emojis(t.get("title", "")).strip(),
                    "angle": strip_emojis(t.get("angle", discipline)).strip(),
                    "problem": strip_emojis(t.get("problem", "")).strip(),
                    "primary_sources": [strip_emojis(s).strip() for s in (t.get("primary_sources") or [])[:4]],
                    "innovation": strip_emojis(t.get("innovation", "")).strip(),
                })
            if clean_topics:
                return {
                    "accepted": True,
                    "topics": clean_topics,
                    "mentor_note": strip_emojis(parsed.get("mentor_note") or "选题贵在切题务实，有原典可据、有真问题可辨。请择定一题进入特藏引文检索。"),
                    "fallback": False,
                }
    except Exception as e:
        print(f"[ThesisService] 云端拟题降级至本地题库: {e}")

    # 确定性本地智能匹配排序
    scored: List[Tuple[int, Dict[str, Any]]] = []
    search_blob = f"{kw} {discipline}"
    for item in _CURATED_ZHUXI_TOPICS:
        s = sum(3 for tag in item["tags"] if tag in search_blob)
        if kw and kw in item["title"]:
            s += 5
        scored.append((s, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    picked = [{k: v for k, v in it.items() if k != "tags"} for _, it in scored[:5]]

    # 若用户输入了特定朱子关键词且不在前 5 题标题中，额外量身合成首题
    if kw and not any(kw in p["title"] for p in picked):
        picked[0] = {
            "title": f"朱子文化视域下“{kw}”的原典脉络与当代转化研究",
            "angle": discipline or "朱子文化专题",
            "problem": f"围绕“{kw}”溯源《朱子语类》《四书章句集注》及闽北特藏史料，厘清朱熹本义并回应学界争鸣。",
            "primary_sources": ["《四书章句集注》", "《朱子语类》", "《世纪之交的朱子学》"],
            "innovation": f"立足武夷学院逸夫图书馆特藏文献对勘，深化“{kw}”的在地学术阐释与现实观照。",
        }

    return {
        "accepted": True,
        "topics": picked,
        "mentor_note": "老夫已据贤生所向与逸夫图书馆特藏书目拟就五题。选题宜小而深，务须落脚原典文献，切忌空疏泛论。",
        "fallback": bool(zhuzi_agent.api_key),
    }


# ==========================================
# 4. 结构化三级大纲生成
# ==========================================

def generate_outline(
    topic: str,
    thesis_type: str = "本科毕业论文",
    discipline: str = "朱子理学与哲学",
    target_words: int = 6000,
    citations: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """生成可编辑的三级结构化朱子文化论文大纲"""
    clean_topic = strip_emojis(topic or "").strip()
    if not clean_topic:
        raise ValueError("请先填写或选定论文题目")
    if not is_zhuxi_thesis_topic(clean_topic):
        raise ValueError("当前题目偏离朱子文化与理学特藏范畴，请在题目中明确朱子文化研究对象")

    target_words = max(1500, min(30000, int(target_words or 6000)))
    cit_list = citations or search_library_citations(clean_topic, top_k=4)
    cit_summary = "\n".join(
        f"[{i+1}] {c.get('book_title', '')}（索书号：{c.get('call_number', '')}）：{c.get('quote', '')[:90]}"
        for i, c in enumerate(cit_list[:6])
    )

    user_prompt = (
        f"论文题目：{clean_topic}\n"
        f"论文类型：{thesis_type}\n"
        f"学科视角：{discipline}\n"
        f"目标总字数：{target_words} 字\n"
        f"已收编武夷学院特藏引文：\n{cit_summary or '《四书章句集注》《朱子语类》《近思录》'}\n\n"
        "请严格按照 JSON 格式输出三级结构化论文大纲与摘要草案，不得包含任何表情符号。"
    )

    try:
        raw = _call_thesis_llm(THESIS_OUTLINE_PROMPT, user_prompt, temperature=0.5, max_tokens=2400, timeout=40.0)
        parsed = _extract_json_object(raw)
        if parsed and isinstance(parsed.get("chapters"), list) and len(parsed["chapters"]) >= 3:
            chapters = []
            for idx, ch in enumerate(parsed["chapters"][:7]):
                if not isinstance(ch, dict) or not ch.get("title"):
                    continue
                chapters.append({
                    "id": str(ch.get("id") or f"ch{idx+1}"),
                    "title": strip_emojis(ch.get("title", "")).strip(),
                    "target_words": max(300, int(ch.get("target_words") or (target_words // max(4, len(parsed["chapters"]))))),
                    "summary": strip_emojis(ch.get("summary", "")).strip(),
                    "sections": [strip_emojis(s).strip() for s in (ch.get("sections") or []) if str(s).strip()],
                    "suggested_sources": [strip_emojis(s).strip() for s in (ch.get("suggested_sources") or []) if str(s).strip()],
                    "content": "",
                })
            if chapters:
                return {
                    "abstract": strip_emojis(parsed.get("abstract", "")).strip(),
                    "keywords": [strip_emojis(k).strip() for k in (parsed.get("keywords") or ["朱子文化", "宋明理学", "武夷特藏"])[:6]],
                    "problem_statement": strip_emojis(parsed.get("problem_statement", "")).strip(),
                    "literature_review_guide": strip_emojis(parsed.get("literature_review_guide", "")).strip(),
                    "chapters": chapters,
                    "fallback": False,
                }
    except Exception as e:
        print(f"[ThesisService] 云端生成大纲降级至本地结构模板: {e}")

    # 离线高质量结构化大纲兜底
    book_names = list(dict.fromkeys([c.get("book_title", "《朱子语类》") for c in cit_list[:4]])) or ["《四书章句集注》", "《朱子语类》", "《近思录》"]
    w1 = int(target_words * 0.16)
    w2 = int(target_words * 0.28)
    w3 = int(target_words * 0.32)
    w4 = max(400, target_words - w1 - w2 - w3)

    return {
        "abstract": (
            f"本文立足武夷学院逸夫图书馆宋明理学特藏文献与《闽北文库》，以“{clean_topic}”为核心研究对象。"
            f"全文综合运用文献考据、义理阐释与比较研究方法，系统梳理由{'、'.join(book_names[:3])}所承载的朱子原典脉络，"
            "辨析宋明清以降相关学术争鸣，澄清后世片面解读，并进一步探讨朱子文化在当代高校育人、社会伦理与文化传承中的创造性转化路径。"
        ),
        "keywords": ["朱子文化", "宋明理学", "原典考据", "武夷特藏", "当代转化"],
        "problem_statement": (
            f"围绕“{clean_topic}”，当前学界研究或偏重宏观概论而失于原典细读，或流于史料堆砌而少见现实观照。"
            "本文拟以武夷学院特藏第一手典籍为依托，贯通字句训诂、哲学义理与当代实践三个层面，回应核心问题意识。"
        ),
        "literature_review_guide": (
            "文献综述宜分三脉展开：其一，梳理南宋以降考亭后学与明清学者（如黄干、陈淳、王夫之、戴震）对此议题的承继与争辩；"
            "其二，评述钱穆《朱子新学案》、陈来《朱子哲学研究》、蒙培元等现当代权威研究的范式贡献与未竟之处；"
            "其三，结合武夷学院朱子学研究中心《世纪之交的朱子学》《考亭论坛专辑》等在地成果，明确本文的切入空隙。"
        ),
        "chapters": [
            {
                "id": "ch1",
                "title": "第一章 绪论：问题缘起与学术史回顾",
                "target_words": w1,
                "summary": f"界定“{clean_topic}”的研究边界与核心概念，梳理宋明清至现当代学术史脉络，说明依托武夷学院特藏文献的研究路径。",
                "sections": [
                    "1.1 研究背景与问题意识的提出",
                    "1.2 国内外研究现状与学术史评述",
                    "1.3 研究思路、文献依据与创新尝试",
                ],
                "suggested_sources": book_names[:2],
                "content": "",
            },
            {
                "id": "ch2",
                "title": "第二章 原典溯源与核心范畴考辨",
                "target_words": w2,
                "summary": "回归朱子传世原典，逐层训释核心概念的字义流变与文本语境，区分早年探索与晚年定论，筑牢全篇立论根基。",
                "sections": [
                    "2.1 核心典籍文本脉络与版本依据",
                    "2.2 关键理学范畴的字义训诂与内在结构",
                    "2.3 朱子武夷考亭讲学实践中的义理展开",
                ],
                "suggested_sources": book_names[:3],
                "content": "",
            },
            {
                "id": "ch3",
                "title": "第三章 义理推演与学术史争鸣辨正",
                "target_words": w3,
                "summary": "深入剖析论题的内在逻辑张力，直面朱陆异同、清代考据学批评或现代误读，据理辨正并建构连贯论证体系。",
                "sections": [
                    "3.1 体用一源与工夫次第的内在理路",
                    "3.2 学术史主要分歧的文本对勘与辨正",
                    "3.3 对当代常见误解的学理回应",
                ],
                "suggested_sources": book_names,
                "content": "",
            },
            {
                "id": "ch4",
                "title": "第四章 朱子文化的当代价值转化与结语",
                "target_words": w4,
                "summary": "由古及今，提炼本论题在当代青年修身、书院通识教育或地方文化活化中的实践路径，总结全文并指出待深耕之处。",
                "sections": [
                    "4.1 考亭文脉的现代性转化维度",
                    "4.2 面向当代育人与社会实践的启示",
                    "4.3 结语与研究展望",
                ],
                "suggested_sources": book_names[-2:],
                "content": "",
            },
        ],
        "fallback": bool(zhuzi_agent.api_key),
    }


# ==========================================
# 5. 分章正文 SSE 流式起草 / 润色 / 考据 / 逻辑诊断
# ==========================================

def assist_chapter_stream(
    action: str,
    topic: str,
    chapter_title: str,
    chapter_summary: str = "",
    sections: Optional[List[str]] = None,
    current_draft: str = "",
    citations: Optional[List[Dict[str, Any]]] = None,
    custom_instruction: str = "",
    target_words: int = 1200,
    session_id: str = "thesis_default",
) -> Generator[str, None, None]:
    """分章正文撰写与专项学术精批 SSE 流式输出（零 emoji）"""
    clean_topic = strip_emojis(topic or "").strip()
    clean_ch_title = strip_emojis(chapter_title or "当前章节").strip()
    clean_draft = (current_draft or "").strip()
    action = (action or "draft").strip().lower()

    if clean_topic and not is_zhuxi_thesis_topic(clean_topic):
        msg = "当前题目偏离朱子文化与武夷理学特藏研究范畴，请先在第一步调整为朱子文化相关论题后再行撰润。"
        yield f"data: {json.dumps({'type': 'token', 'content': msg}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'fallback': False}, ensure_ascii=False)}\n\n"
        return

    zhuzi_agent.cleanup_stopped_session(session_id)

    # 额外为“原典考据增补”或“起草”补充实时 RAG 检索
    rag_query = f"{clean_topic} {clean_ch_title} {chapter_summary} {clean_draft[:180]}"
    live_chunks = rag_service.search(rag_query, top_k=4)
    rag_block = "\n".join(
        f"- 来源《{c.get('source', '').replace('.txt', '')}》：{ _clean_corpus_excerpt(c.get('content', ''), 220)[1] }"
        for c in live_chunks
    )

    cit_list = citations or []
    cit_block = "\n".join(
        f"[{i+1}] {c.get('book_title', '')}（{c.get('call_number', '')}）：{c.get('quote', '')[:160]}"
        for i, c in enumerate(cit_list[:8])
    )

    sec_block = "\n".join(f"- {s}" for s in (sections or [])) or "- 按本章逻辑自然分节"

    action_label_map = {
        "draft": "按提纲起草",
        "polish": "学术化润色",
        "cite": "原典考据增补",
        "diagnose": "论证逻辑诊断",
        "ask": "自由请教",
    }
    action_label = action_label_map.get(action, "按提纲起草")

    user_parts = [
        f"【执行任务】：{action_label}",
        f"【论文总题】：{clean_topic}",
        f"【当前章节】：{clean_ch_title}（目标约 {target_words} 字）",
        f"【本章提要】：{chapter_summary or '紧扣全篇主旨展开严谨论证'}",
        f"【本章小节结构】：\n{sec_block}",
    ]
    if cit_block:
        user_parts.append(f"【本文已收编特藏引文库（请在正文引用处规范标注 [1]、[2]）】：\n{cit_block}")
    if rag_block:
        user_parts.append(f"【实时检出之武夷学院特藏原典参阅依据】：\n{rag_block}")
    if clean_draft:
        user_parts.append(f"【学者当前本章草稿】：\n{clean_draft[:3500]}")
    if custom_instruction:
        user_parts.append(f"【学者附加要求】：{strip_emojis(custom_instruction)}")

    if action in ("polish", "cite", "diagnose") and not clean_draft:
        msg = f"当前章节尚无草稿正文，请先在左侧编辑器输入或粘贴一段文字，或先点击“按提纲生成本章初稿”，再执行“{action_label}”。"
        yield f"data: {json.dumps({'type': 'token', 'content': msg}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'fallback': False}, ensure_ascii=False)}\n\n"
        return

    yield f"data: {json.dumps({'type': 'meta', 'action': action, 'action_label': action_label}, ensure_ascii=False)}\n\n"

    has_yielded = False
    used_fallback = False

    if zhuzi_agent.api_key and zhuzi_agent._http_client:
        headers = {
            "Authorization": f"Bearer {zhuzi_agent.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": getattr(zhuzi_agent, "llm_model", "glm-4-flash"),
            "messages": [
                {"role": "system", "content": THESIS_DRAFT_ASSIST_PROMPT},
                {"role": "user", "content": "\n\n".join(user_parts)},
            ],
            "temperature": 0.55 if action in ("polish", "diagnose", "cite") else 0.65,
            "max_tokens": 2400,
            "stream": True,
        }
        try:
            with zhuzi_agent._http_client.stream(
                "POST", _get_chat_endpoint(), headers=headers, json=payload, timeout=55.0
            ) as resp:
                resp.raise_for_status()
                for line in resp.iter_lines():
                    if zhuzi_agent.is_session_stopped(session_id):
                        break
                    if not line:
                        continue
                    s = line.strip()
                    if not s.startswith("data:"):
                        continue
                    data_str = s[5:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(data_str)
                    except Exception:
                        continue
                    delta = (chunk_json.get("choices") or [{}])[0].get("delta") or {}
                    tok = delta.get("content") or ""
                    if not tok:
                        continue
                    clean_tok = strip_emojis(tok)
                    if clean_tok:
                        has_yielded = True
                        yield f"data: {json.dumps({'type': 'token', 'content': clean_tok}, ensure_ascii=False)}\n\n"
        except Exception as e:
            print(f"[ThesisService] 分章流式辅助失败: {e}")

    if not has_yielded and not zhuzi_agent.is_session_stopped(session_id):
        used_fallback = bool(zhuzi_agent.api_key)
        fb_text = _build_offline_chapter_assist(
            action=action,
            topic=clean_topic,
            chapter_title=clean_ch_title,
            chapter_summary=chapter_summary,
            sections=sections or [],
            current_draft=clean_draft,
            citations=cit_list,
            live_chunks=live_chunks,
        )
        # 温和分段推送，保持流式体验
        step = 36
        for i in range(0, len(fb_text), step):
            if zhuzi_agent.is_session_stopped(session_id):
                break
            yield f"data: {json.dumps({'type': 'token', 'content': fb_text[i : i + step]}, ensure_ascii=False)}\n\n"
            time.sleep(0.015)

    yield f"data: {json.dumps({'type': 'done', 'fallback': used_fallback}, ensure_ascii=False)}\n\n"


def _build_offline_chapter_assist(
    action: str,
    topic: str,
    chapter_title: str,
    chapter_summary: str,
    sections: List[str],
    current_draft: str,
    citations: List[Dict[str, Any]],
    live_chunks: List[Dict[str, Any]],
) -> str:
    """云端暂忙时的学术级本地兜底文本（零 emoji）"""
    first_cit = citations[0] if citations else None
    cit_quote = (
        f"正如{first_cit.get('book_title', '《朱子语类》')}所载：“{first_cit.get('quote', '')[:110]}”[1]"
        if first_cit
        else "正如《四书章句集注》所言：“即凡天下之物，莫不因其已知之理而益穷之，以求至乎其极。”[1]"
    )

    if action == "polish":
        polished_preview = re.sub(r'我觉得|我认为其实|总的来说就是|非常的好|很厉害', '笔者以为', current_draft)
        return (
            f"【润色后正文（参考修订稿）】\n\n"
            f"{polished_preview}\n\n"
            "【修改要点说明】\n"
            "1. 口语化排查：建议将文中主观口语（如“我觉得”“其实”“非常”）替换为学术书面语（如“由是观之”“就文本脉络而言”“足见其义理深意”）。\n"
            "2. 概念精准度：凡涉及“理气”“心性”“格物”“居敬”等核心范畴，首次出现宜交代朱子原典界定，避免借用现代词义直接等同。\n"
            f"3. 引文衔接：在核心论断后补入原典实证，例如：{cit_quote}，以增强论证说服力。\n"
            "（说明：当前云端模型暂忙，以上为考亭本地审校建议，可直接采纳编辑。）"
        )

    if action == "cite":
        extra_lines = []
        for idx, ch in enumerate(live_chunks[:3], start=1):
            src = strip_emojis(ch.get("source", "").replace(".txt", ""))
            _, ex = _clean_corpus_excerpt(ch.get("content", ""), 140)
            extra_lines.append(f"{idx}. 出自《{src}》：“{ex}”")
        extra_str = "\n".join(extra_lines) or "1. 出自《朱子语类》：“未有天地之先，毕竟也只是理。”"
        return (
            f"【原典考据增补建议 · {chapter_title}】\n\n"
            "结合武夷学院逸夫图书馆特藏语料库，为本章当前草稿匹配到以下可直接嵌入的原典引证：\n\n"
            f"{extra_str}\n\n"
            "【嵌入写法示例】\n"
            f"在推进“{topic}”的核心论证时，可于段中承接道：细绎朱子原典，{cit_quote}。此一表述不仅确立了义理根基，亦为后文回应学界分歧提供了确凿文本支点。"
        )

    if action == "diagnose":
        word_len = len(re.sub(r'\s+', '', current_draft))
        has_quote = ("《" in current_draft) or ("“" in current_draft)
        return (
            f"【论证逻辑诊断报告 · {chapter_title}】\n\n"
            f"当前草稿实测约 {word_len} 字。经初步核验，提出以下四项逻辑改进意见：\n\n"
            f"1. 原典支撑密度：{'文中已出现典籍引述，建议进一步核对引文版本并标明卷次与角标 [n]。' if has_quote else '当前段落尚缺直接原典引证，容易显得空疏，建议立即补充《朱子语类》或《四书章句集注》一手原句。'}\n"
            "2. 概念边界核查：请复检是否将朱子“理在气先（逻辑在先）”误写为时间先后，或将“存天理、灭人欲”窄化为禁欲主义。\n"
            "3. 段落推进节奏：建议每节遵循“提出分论点 — 援引原典并训释 — 辨析学界异说 — 小结收束”四步结构，避免平铺直叙。\n"
            f"4. 与总题扣合度：请在本章结尾补写 2 至 3 句过渡句，明确说明本章如何为总论题“{topic}”的下章推演铺垫。"
        )

    if action == "ask":
        return (
            f"【考亭研撰答疑 · {chapter_title}】\n\n"
            f"围绕总题“{topic}”与本章论旨，治学当守“字求其训、句索其旨”之法。建议先紧扣本章核心问题，以武夷学院逸夫图书馆特藏原典立据：{cit_quote}。\n\n"
            "在此基础上，先厘清朱子早年与晚年思想演进，再回应后儒（如陆九渊或戴震）之辩难，文章自见筋骨。仁兄可将具体难写的一段草稿贴入编辑器，由老夫逐句点拨。"
        )

    # 默认：按提纲起草参考初稿
    sec_list = sections or [f"{chapter_title} 核心义理阐发", "原典依据与文本考辨", "本章小结与逻辑过渡"]
    blocks = [f"### {sec_list[0]}\n\n围绕“{topic}”这一核心论题，本章聚焦“{chapter_title}”展开考察。{chapter_summary or '治朱子之学者，必先追溯原典脉络，方能避免望文生义之弊。'}在宋代理学由北宋五子演进至南宋考亭学派的进程中，朱熹承继二程洛学而集其大成，将形上本体与日用工夫融为一贯。"]
    blocks.append(f"### {sec_list[1] if len(sec_list) > 1 else '原典考据与义理展开'}\n\n细察武夷学院逸夫图书馆所藏理学核心典籍，{cit_quote}。由文本上下文观之，朱子立言并非悬空构设概念体系，而是始终紧扣学者切己体察与经世致用之双重要求。若仅以近代学科分立之眼光割裂观之，则易失其“体用一源、显微无间”的整体气象。")
    if len(sec_list) > 2:
        blocks.append(f"### {sec_list[2]}\n\n综上所述，本章从原典依据与内在理路两方面奠定了论题基础，为下一章进一步展开学术史争鸣辨正与当代转化阐发做好了逻辑铺垫。")
    blocks.append("（注：以上为结合当前提纲与馆藏引文生成的参考初稿，请学者结合原典自行核校扩充。）")
    return "\n\n".join(blocks)


# ==========================================
# 6. 五维学术体检审稿与互动式模拟答辩
# ==========================================

def review_thesis(project: Dict[str, Any]) -> Dict[str, Any]:
    """对当前论文（题目、摘要、大纲、引文库、各章正文）开展五维学术体检"""
    title = strip_emojis(project.get("title") or "").strip()
    abstract = strip_emojis(project.get("abstract") or "").strip()
    chapters = project.get("chapters") or []
    citations = project.get("citations") or []

    total_words = sum(len(re.sub(r'\s+', '', str(ch.get("content") or ""))) for ch in chapters)
    filled_chapters = sum(1 for ch in chapters if len(re.sub(r'\s+', '', str(ch.get("content") or ""))) >= 80)

    excerpt_lines = []
    for ch in chapters[:6]:
        body = str(ch.get("content") or "").strip()
        w_cnt = len(re.sub(r'\s+', '', body))
        excerpt_lines.append(
            f"- {ch.get('title', '未命名章节')}（已写 {w_cnt} 字 / 目标 {ch.get('target_words', 1000)} 字）："
            f"{body[:420] if body else '【尚未撰稿，仅有提要：' + str(ch.get('summary', '')) + '】'}"
        )

    user_prompt = (
        f"论文题目：{title}\n"
        f"论文类型：{project.get('thesis_type', '本科毕业论文')} | 目标字数：{project.get('target_words', 6000)} 字 | 当前实写总字数：{total_words} 字\n"
        f"已收编武夷特藏参考文献：{len(citations)} 条\n"
        f"中文摘要：{abstract or '尚未填写'}\n"
        f"各章节完成情况与文本摘要：\n" + "\n".join(excerpt_lines) + "\n\n"
        "请严格按照五维学术体检 JSON 格式客观评分与出具修改清单，不得出现任何表情符号。"
    )

    try:
        raw = _call_thesis_llm(THESIS_REVIEW_PROMPT, user_prompt, temperature=0.4, max_tokens=1800, timeout=38.0)
        parsed = _extract_json_object(raw)
        if parsed and isinstance(parsed.get("dimensions"), list) and len(parsed["dimensions"]) >= 4:
            dims = []
            for d in parsed["dimensions"][:5]:
                dims.append({
                    "name": strip_emojis(d.get("name", "")),
                    "score": max(0, min(100, int(d.get("score") or 75))),
                    "comment": strip_emojis(d.get("comment", "")),
                })
            return {
                "overall_score": max(0, min(100, int(parsed.get("overall_score") or 78))),
                "grade": strip_emojis(parsed.get("grade") or "良好"),
                "total_words": total_words,
                "filled_chapters": filled_chapters,
                "chapter_count": len(chapters),
                "citation_count": len(citations),
                "dimensions": dims,
                "strengths": [strip_emojis(x) for x in (parsed.get("strengths") or [])[:4]],
                "revisions": [
                    {
                        "priority": strip_emojis(r.get("priority", "中")),
                        "target": strip_emojis(r.get("target", "全文")),
                        "issue": strip_emojis(r.get("issue", "")),
                        "suggestion": strip_emojis(r.get("suggestion", "")),
                    }
                    for r in (parsed.get("revisions") or [])[:5]
                    if isinstance(r, dict)
                ],
                "mentor_verdict": strip_emojis(parsed.get("mentor_verdict") or ""),
                "fallback": False,
            }
    except Exception as e:
        print(f"[ThesisService] 云端审稿降级至本地量化体检: {e}")

    # 客观量化本地体检兜底
    target_words = max(1500, int(project.get("target_words") or 6000))
    completion_ratio = min(1.0, total_words / float(target_words))
    s_topic = 86 if is_zhuxi_thesis_topic(title) and len(title) >= 10 else 72
    s_cite = min(92, 62 + len(citations) * 6)
    s_logic = int(66 + 22 * completion_ratio) if chapters else 60
    s_norm = min(90, (74 if abstract else 62) + (10 if len(citations) >= 3 else 0) + (6 if filled_chapters == len(chapters) and chapters else 0))
    s_style = int(68 + 18 * completion_ratio) if total_words >= 300 else 65
    overall = int(round((s_topic + s_cite + s_logic + s_norm + s_style) / 5.0))
    grade = "优秀 · 可赴预答辩" if overall >= 85 else ("良好 · 修订后可开题" if overall >= 75 else "初具雏形 · 尚须充实正文")

    revisions = []
    if total_words < target_words * 0.5:
        revisions.append({
            "priority": "高",
            "target": "正文章节",
            "issue": f"当前累计正文约 {total_words} 字，距目标 {target_words} 字尚有较大缺口。",
            "suggestion": "请在第四步逐章调用“按提纲生成参考初稿”并结合个人阅读笔记扩写论证段落。",
        })
    if len(citations) < 3:
        revisions.append({
            "priority": "高",
            "target": "参考文献库",
            "issue": f"当前仅收编 {len(citations)} 条馆藏引文，原典支撑偏薄。",
            "suggestion": "返回第二步检索《朱子语类》《四书章句集注》及《闽北文库》专著，至少收编 3 至 6 条一手引文。",
        })
    if not abstract or len(abstract) < 80:
        revisions.append({
            "priority": "中",
            "target": "中文摘要与关键词",
            "issue": "摘要内容过短或尚未填写，难以统摄全篇主旨。",
            "suggestion": "在第三步补全 200 至 300 字结构化摘要，交代研究问题、原典方法与核心结论。",
        })
    revisions.append({
        "priority": "中",
        "target": "学术争鸣回应",
        "issue": "理学论文若仅顺述原典而无学术史交锋，深度有限。",
        "suggestion": "在主体章中补充对陆九渊心学或清儒戴震批评的文本辨析，展现思辨厚度。",
    })

    return {
        "overall_score": overall,
        "grade": grade,
        "total_words": total_words,
        "filled_chapters": filled_chapters,
        "chapter_count": len(chapters),
        "citation_count": len(citations),
        "dimensions": [
            {"name": "选题立意", "score": s_topic, "comment": "题目紧扣朱子文化核心文脉，问题方向清晰。"},
            {"name": "原典考据", "score": s_cite, "comment": f"已收编武夷特藏文献 {len(citations)} 条，建议正文引文逐一标明卷次。"},
            {"name": "论证逻辑", "score": s_logic, "comment": f"已立 {len(chapters)} 章框架，已撰 {filled_chapters} 章正文，需注意章间递进。"},
            {"name": "学术规范", "score": s_norm, "comment": "支持 GB/T 7714-2015 文献规范，摘要与角标宜保持通篇一致。"},
            {"name": "行文风骨", "score": s_style, "comment": "行文宜守沉实典雅之风，避免口语化与空泛套语。"},
        ],
        "strengths": [
            f"选题“{title or '朱子文化研学'}”立足武夷学院特藏，具有鲜明在地学术辨识度。",
            "论文采用分阶结构化推进，提纲层次分明，具备良好可写性。",
        ],
        "revisions": revisions[:4],
        "mentor_verdict": (
            f"老夫细阅贤生所拟《{title or '朱子文化论稿'}》，当前已成 {len(chapters)} 章骨架、实撰 {total_words} 字、收编特藏 {len(citations)} 条。"
            "大本既立，重在沉潜精研、字求其训。请依上列修改意见逐项补正，再入模拟答辩历练思辨。"
        ),
        "fallback": bool(zhuzi_agent.api_key),
    }


def defense_simulation(
    action: str,
    project: Dict[str, Any],
    question: str = "",
    answer: str = "",
) -> Dict[str, Any]:
    """互动式模拟答辩：生成针对本文的质询题 / 评阅学生答辩陈词"""
    title = strip_emojis(project.get("title") or "朱子文化研究论文").strip()
    chapters = project.get("chapters") or []
    citations = project.get("citations") or []
    ch_outline = "；".join(strip_emojis(c.get("title", "")) for c in chapters[:5]) or "绪论、原典考辨、义理辨正、当代转化"
    cit_books = "、".join(dict.fromkeys(strip_emojis(c.get("book_title", "")) for c in citations[:5])) or "《四书章句集注》《朱子语类》"

    if action == "evaluate":
        student_ans = strip_emojis(answer or "").strip()
        if len(student_ans) < 10:
            raise ValueError("答辩陈词过短，请至少阐述 10 字以上的核心观点后再提交评阅")

        user_prompt = (
            f"action=evaluate\n"
            f"论文题目：{title}\n"
            f"论文章节：{ch_outline}\n"
            f"答辩质询问题：{strip_emojis(question)}\n"
            f"学生答辩陈词：{student_ans}\n\n"
            "请以答辩委员会主席身份客观评阅，按 JSON 格式输出，严禁出现任何表情符号。"
        )
        try:
            raw = _call_thesis_llm(THESIS_DEFENSE_PROMPT, user_prompt, temperature=0.45, max_tokens=1200, timeout=30.0)
            parsed = _extract_json_object(raw)
            if parsed and parsed.get("comment"):
                return {
                    "score": max(0, min(100, int(parsed.get("score") or 80))),
                    "verdict": strip_emojis(parsed.get("verdict") or "答辩通过"),
                    "comment": strip_emojis(parsed.get("comment", "")),
                    "gaps": [strip_emojis(g) for g in (parsed.get("gaps") or [])[:3]],
                    "model_answer": strip_emojis(parsed.get("model_answer", "")),
                    "fallback": False,
                }
        except Exception as e:
            print(f"[ThesisService] 云端答辩评阅降级: {e}")

        has_ref = any(k in student_ans for k in ("《", "语类", "章句", "大学", "中庸", "近思录", "朱子", "原典"))
        base_score = 72 + min(14, len(student_ans) // 18) + (8 if has_ref else 0)
        base_score = min(94, base_score)
        return {
            "score": base_score,
            "verdict": "答辩通过 · 条理清通" if base_score >= 80 else "尚须补正 · 深化原典依据",
            "comment": (
                f"老夫细听贤生陈词，立意尚属端正。{'能主动援引典籍切题作答，颇见平日用功；' if has_ref else '陈词侧重概括，尚少一手原典例证；'}"
                "答辩之际贵在先亮核心立场，再引《朱子语类》或《四书章句集注》原文坐实，最后收束到本论文的独特贡献。"
            ),
            "gaps": [
                "若能点明具体卷次或区分朱子早晚年定论，说服力将显著增强。",
                "回应异说时宜先概括对方理据，再作辨正，切忌自说自话。",
            ],
            "model_answer": (
                f"各位评委老师好。关于这一问题，本文在“{title}”中立足{cit_books}等武夷特藏文献作出三层回应："
                "第一，从文本原意界定核心概念，澄清后世望文生义之误；"
                "第二，通过学术史比较凸显朱子体用兼顾的整体视角；"
                "第三，将其落实到当代育人与文化实践，形成严密闭环。"
            ),
            "fallback": bool(zhuzi_agent.api_key),
        }

    # action == "questions"
    user_prompt = (
        f"action=questions\n"
        f"论文题目：{title}\n"
        f"论文章节：{ch_outline}\n"
        f"核心馆藏典籍：{cit_books}\n\n"
        "请命制 3 道针对本篇论文的高质量答辩委员会质询问题，严格输出 JSON，严禁出现任何表情符号。"
    )
    try:
        raw = _call_thesis_llm(THESIS_DEFENSE_PROMPT, user_prompt, temperature=0.55, max_tokens=1200, timeout=30.0)
        parsed = _extract_json_object(raw)
        if parsed and isinstance(parsed.get("questions"), list) and len(parsed["questions"]) >= 2:
            qs = []
            for i, item in enumerate(parsed["questions"][:3]):
                if not isinstance(item, dict) or not item.get("question"):
                    continue
                qs.append({
                    "id": str(item.get("id") or f"q{i+1}"),
                    "category": strip_emojis(item.get("category") or f"质询{i+1}"),
                    "question": strip_emojis(item.get("question", "")),
                    "focus": strip_emojis(item.get("focus", "")),
                })
            if qs:
                return {"questions": qs, "fallback": False}
    except Exception as e:
        print(f"[ThesisService] 云端答辩命制降级: {e}")

    return {
        "questions": [
            {
                "id": "q1",
                "category": "义理本体辨析",
                "question": f"围绕你的题目《{title}》，你如何界定其中最核心的朱子哲学范畴，并与既有学界通行阐释区分开来？",
                "focus": "考查核心概念界定是否严谨、问题意识是否锋利",
            },
            {
                "id": "q2",
                "category": "文献版本考证",
                "question": f"文中依托{cit_books}展开论证，你如何处理《朱子语类》门人记录差异与朱子本人手定章句之间的张力？",
                "focus": "考查对一手原典版本与史料辨伪的学术功底",
            },
            {
                "id": "q3",
                "category": "当代价值回应",
                "question": "若有人质疑宋代理学命题距离现代社会过远，你的论文如何在不牵强附会的前提下论证其当代生命力？",
                "focus": "考查古今转化逻辑是否自然、避免以今律古",
            },
        ],
        "fallback": bool(zhuzi_agent.api_key),
    }


# ==========================================
# 7. Word (.docx 完整论文版 / 开题报告书版) 与 Markdown (.md) 规范导出
# ==========================================

def build_markdown_export(project: Dict[str, Any], template: str = "full") -> str:
    """生成零表情图标、结构严谨的 Markdown 文档"""
    title = strip_emojis(project.get("title") or "朱子文化专题研究论文").strip()
    thesis_type = strip_emojis(project.get("thesis_type") or "本科毕业论文")
    discipline = strip_emojis(project.get("discipline") or "朱子理学与传统文化")
    target_words = int(project.get("target_words") or 6000)
    author_name = strip_emojis(project.get("author_name") or "").strip()
    student_id = strip_emojis(project.get("student_id") or "").strip()
    college = strip_emojis(project.get("college") or "武夷学院").strip()
    advisor = strip_emojis(project.get("advisor") or "").strip()
    abstract = strip_emojis(project.get("abstract") or "").strip()
    keywords = [strip_emojis(k).strip() for k in (project.get("keywords") or []) if str(k).strip()]
    problem_stmt = strip_emojis(project.get("problem_statement") or "").strip()
    lit_guide = strip_emojis(project.get("literature_review_guide") or "").strip()
    chapters = project.get("chapters") or []
    citations = project.get("citations") or []
    review = project.get("review") or None
    date_str = time.strftime("%Y年%m月%d日")

    lines: List[str] = []
    if template == "proposal":
        lines.append(f"# {title} —— 开题报告书")
    else:
        lines.append(f"# {title}")
    lines.append("")
    meta_parts = [f"- **论文类型**：{thesis_type}", f"- **研究方向**：{discipline}", f"- **目标字数**：{target_words} 字"]
    if author_name:
        meta_parts.append(f"- **作者姓名**：{author_name}")
    if student_id:
        meta_parts.append(f"- **学号**：{student_id}")
    if college:
        meta_parts.append(f"- **所属单位**：{college}")
    if advisor:
        meta_parts.append(f"- **指导教师**：{advisor}")
    meta_parts.append(f"- **特藏文献依托**：武夷学院逸夫图书馆宋明理学特藏室 · 闽北文库")
    meta_parts.append(f"- **成稿日期**：{date_str}")
    lines.extend(meta_parts)
    lines.append("")
    lines.append("---")
    lines.append("")

    if template == "proposal":
        lines.append("## 一、选题依据与核心问题意识")
        lines.append("")
        lines.append(problem_stmt or abstract or "本课题立足武夷学院逸夫图书馆宋明理学特藏文献，系统考辨朱子文化核心义理与当代转化路径。")
        lines.append("")
        lines.append("## 二、文献综述与学术史脉络")
        lines.append("")
        lines.append(lit_guide or "拟梳理宋明清以降相关典籍注疏与现当代朱子学代表研究成果，确立本文切入视角。")
        lines.append("")
        lines.append("## 三、论文结构框架与研究内容")
        lines.append("")
        for ch in chapters:
            lines.append(f"### {strip_emojis(ch.get('title', '未命名章节'))}（预计 {ch.get('target_words', 1000)} 字）")
            if ch.get("summary"):
                lines.append(f"- **本章提要**：{strip_emojis(ch['summary'])}")
            for sec in ch.get("sections") or []:
                lines.append(f"  - {strip_emojis(sec)}")
            lines.append("")
        lines.append("## 四、研究进度安排")
        lines.append("")
        lines.append("| 阶段 | 核心任务 | 预期成果 |")
        lines.append("| --- | --- | --- |")
        lines.append("| 第一阶段 | 查阅武夷学院逸夫图书馆特藏典籍，完成原典摘录 | 形成核心引文库与开题报告 |")
        lines.append("| 第二阶段 | 深化概念训诂与学术史争鸣辨正，撰写主体章节初稿 | 完成论文初稿 |")
        lines.append("| 第三阶段 | 核校引文版本与 GB/T 7714 参考文献格式，润色定稿 | 提交正式论文并参加答辩 |")
        lines.append("")
    else:
        if abstract:
            lines.append("## 摘要")
            lines.append("")
            lines.append(abstract)
            lines.append("")
        if keywords:
            lines.append(f"**关键词**：{'；'.join(keywords)}")
            lines.append("")
        for ch in chapters:
            lines.append(f"## {strip_emojis(ch.get('title', '未命名章节'))}")
            lines.append("")
            body = strip_emojis(ch.get("content") or "").strip()
            if body:
                lines.append(body)
            else:
                if ch.get("summary"):
                    lines.append(f"> 本章写作提要：{strip_emojis(ch['summary'])}")
                    lines.append("")
                for sec in ch.get("sections") or []:
                    lines.append(f"### {strip_emojis(sec)}")
                    lines.append("")
                    lines.append("（待续写本节正文）")
                    lines.append("")
            lines.append("")

    # 参考文献（GB/T 7714-2015）
    lines.append("## 参考文献（GB/T 7714-2015）")
    lines.append("")
    if citations:
        for idx, c in enumerate(citations, start=1):
            gbt = strip_emojis(c.get("gbt7714") or format_gbt7714(c.get("book_title", ""), c.get("author", "")))
            lines.append(f"[{idx}] {gbt}")
    else:
        lines.append("[1] 朱熹. 四书章句集注[M]. 北京: 中华书局, 2011.")
        lines.append("[2] 黎靖德, 编. 朱子语类[M]. 北京: 中华书局, 1986.")
    lines.append("")

    # 馆藏索书号附录
    if citations:
        lines.append("## 附录：武夷学院逸夫图书馆特藏索书号一览")
        lines.append("")
        lines.append("| 序号 | 典籍题名 | 著者 | OPAC 索书号 | 馆藏地 |")
        lines.append("| --- | --- | --- | --- | --- |")
        for idx, c in enumerate(citations, start=1):
            lines.append(
                f"| {idx} | {strip_emojis(c.get('book_title', ''))} | {strip_emojis(c.get('author', ''))} "
                f"| `{c.get('call_number', '-')}` | {strip_emojis(c.get('location', '逸夫图书馆特藏室'))} |"
            )
        lines.append("")

    if review and review.get("mentor_verdict"):
        lines.append("## 考亭导师审稿意见")
        lines.append("")
        lines.append(f"- **综合评分**：{review.get('overall_score', '-')} 分（{strip_emojis(review.get('grade', ''))}）")
        lines.append(f"- **审稿寄语**：{strip_emojis(review.get('mentor_verdict', ''))}")
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def _set_run_font(run, cn_font: str = "宋体", en_font: str = "Times New Roman", size_pt: float = 12, bold: bool = False, color_rgb: Optional[Tuple[int, int, int]] = None):
    run.font.name = en_font
    run.font.size = Pt(size_pt)
    run.bold = bold
    if color_rgb:
        run.font.color.rgb = RGBColor(*color_rgb)
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:eastAsia"), cn_font)
    rFonts.set(qn("w:ascii"), en_font)
    rFonts.set(qn("w:hAnsi"), en_font)


def _set_table_borders(table, border_color: str = "8C7A6B"):
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), border_color)
        borders.append(el)
    tblPr.append(borders)


def _add_styled_paragraph(
    doc,
    text: str,
    cn_font: str = "宋体",
    size_pt: float = 12,
    bold: bool = False,
    align=WD_ALIGN_PARAGRAPH.LEFT,
    first_line_indent_cm: float = 0.0,
    left_indent_cm: float = 0.0,
    space_before_pt: float = 0,
    space_after_pt: float = 4,
    line_spacing: float = 1.5,
    color_rgb: Optional[Tuple[int, int, int]] = None,
):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before_pt)
    pf.space_after = Pt(space_after_pt)
    pf.line_spacing = line_spacing
    if first_line_indent_cm:
        pf.first_line_indent = Cm(first_line_indent_cm)
    if left_indent_cm:
        pf.left_indent = Cm(left_indent_cm)
    run = p.add_run(strip_emojis(text))
    _set_run_font(run, cn_font=cn_font, size_pt=size_pt, bold=bold, color_rgb=color_rgb)
    return p


def build_docx_export(project: Dict[str, Any], template: str = "full") -> bytes:
    """使用 python-docx 生成规范中文高校排版 Word (.docx) 文档"""
    if not HAS_PYTHON_DOCX:
        raise RuntimeError("当前运行环境未安装 python-docx，无法导出 Word 文档")

    doc = docx.Document()
    for section in doc.sections:
        section.top_margin = Cm(2.54)
        section.bottom_margin = Cm(2.54)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(2.8)

    title = strip_emojis(project.get("title") or "朱子文化专题研究论文").strip()
    thesis_type = strip_emojis(project.get("thesis_type") or "本科毕业论文")
    discipline = strip_emojis(project.get("discipline") or "朱子理学与传统文化")
    target_words = int(project.get("target_words") or 6000)
    author_name = strip_emojis(project.get("author_name") or "待填写").strip()
    student_id = strip_emojis(project.get("student_id") or "待填写").strip()
    college = strip_emojis(project.get("college") or "武夷学院").strip()
    advisor = strip_emojis(project.get("advisor") or "待填写").strip()
    abstract = strip_emojis(project.get("abstract") or "").strip()
    keywords = [strip_emojis(k).strip() for k in (project.get("keywords") or []) if str(k).strip()]
    problem_stmt = strip_emojis(project.get("problem_statement") or "").strip()
    lit_guide = strip_emojis(project.get("literature_review_guide") or "").strip()
    chapters = project.get("chapters") or []
    citations = project.get("citations") or []
    review = project.get("review") or None
    date_str = time.strftime("%Y年%m月%d日")

    # 顶部机构与文种抬头
    _add_styled_paragraph(
        doc,
        f"{college} · 朱子文化研学论文（依托逸夫图书馆宋明理学特藏室）",
        cn_font="楷体",
        size_pt=10.5,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after_pt=6,
        color_rgb=(120, 53, 15),
    )
    doc_heading = f"{title}" if template != "proposal" else f"{title}\n开题报告书"
    _add_styled_paragraph(
        doc,
        doc_heading,
        cn_font="黑体",
        size_pt=18,
        bold=True,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before_pt=6,
        space_after_pt=12,
        line_spacing=1.35,
        color_rgb=(28, 25, 23),
    )

    # 基本信息表（完整版与开题报告版均规范呈现）
    info_rows = [
        ("论文类型", thesis_type, "研究方向", discipline),
        ("作者姓名", author_name, "学号", student_id),
        ("所属院系", college, "指导教师", advisor),
        ("目标字数", f"{target_words} 字", "生成日期", date_str),
    ]
    tbl = doc.add_table(rows=len(info_rows), cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    _set_table_borders(tbl, "B5A695")
    for r_idx, (k1, v1, k2, v2) in enumerate(info_rows):
        row_cells = tbl.rows[r_idx].cells
        for c_idx, val in enumerate((k1, v1, k2, v2)):
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(val)
            is_label = c_idx in (0, 2)
            _set_run_font(run, cn_font="黑体" if is_label else "宋体", size_pt=10.5, bold=is_label)

    _add_styled_paragraph(doc, "", size_pt=6, space_after_pt=4)

    if template == "proposal":
        # 开题报告书规范结构
        _add_styled_paragraph(doc, "一、选题依据与核心问题意识", cn_font="黑体", size_pt=14, bold=True, space_before_pt=10, space_after_pt=6)
        _add_styled_paragraph(
            doc,
            problem_stmt or abstract or "本课题立足武夷学院逸夫图书馆宋明理学特藏文献，结合原典考据与义理阐释，探讨朱子文化的核心精神与当代转化价值。",
            first_line_indent_cm=0.74,
        )

        _add_styled_paragraph(doc, "二、文献综述与学术史研究脉络", cn_font="黑体", size_pt=14, bold=True, space_before_pt=10, space_after_pt=6)
        _add_styled_paragraph(
            doc,
            lit_guide or "拟系统梳理宋明清以来朱子学注疏与辨难传统，评述现当代权威研究成果，并结合《闽北文库》等地方特藏明确本文切入空隙。",
            first_line_indent_cm=0.74,
        )

        _add_styled_paragraph(doc, "三、论文框架结构与各章论证提要", cn_font="黑体", size_pt=14, bold=True, space_before_pt=10, space_after_pt=6)
        for ch in chapters:
            ch_t = f"{strip_emojis(ch.get('title', '未命名章节'))}（预计 {ch.get('target_words', 1000)} 字）"
            _add_styled_paragraph(doc, ch_t, cn_font="黑体", size_pt=12, bold=True, space_before_pt=6, space_after_pt=3)
            if ch.get("summary"):
                _add_styled_paragraph(doc, f"论证提要：{strip_emojis(ch['summary'])}", first_line_indent_cm=0.74, size_pt=11)
            for sec in ch.get("sections") or []:
                _add_styled_paragraph(doc, f"• {strip_emojis(sec)}", left_indent_cm=0.8, size_pt=11, space_after_pt=2)

        _add_styled_paragraph(doc, "四、研究进度安排", cn_font="黑体", size_pt=14, bold=True, space_before_pt=10, space_after_pt=6)
        sched = [
            ("阶段", "时间安排", "核心工作内容与阶段成果"),
            ("第一阶段", "第 1–3 周", "检索武夷学院逸夫图书馆特藏文献，完成核心原典摘录与开题论证"),
            ("第二阶段", "第 4–8 周", "完成各章节初稿撰写，重点落实原典训诂与学术史争鸣辨正"),
            ("第三阶段", "第 9–11 周", "按五维学术规范修订润色，核对 GB/T 7714-2015 参考文献"),
            ("第四阶段", "第 12 周", "定稿装订并准备毕业论文答辩陈词"),
        ]
        stbl = doc.add_table(rows=len(sched), cols=3)
        stbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        _set_table_borders(stbl, "B5A695")
        for r_i, row_vals in enumerate(sched):
            for c_i, val in enumerate(row_vals):
                p = stbl.rows[r_i].cells[c_i].paragraphs[0]
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                run = p.add_run(val)
                _set_run_font(run, cn_font="黑体" if r_i == 0 else "宋体", size_pt=10.5, bold=(r_i == 0))
    else:
        # 完整学术论文结构
        if abstract:
            _add_styled_paragraph(doc, "摘  要", cn_font="黑体", size_pt=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before_pt=8, space_after_pt=6)
            _add_styled_paragraph(doc, abstract, first_line_indent_cm=0.74, size_pt=11.5)
        if keywords:
            p_kw = doc.add_paragraph()
            p_kw.paragraph_format.space_before = Pt(4)
            p_kw.paragraph_format.space_after = Pt(10)
            p_kw.paragraph_format.first_line_indent = Cm(0.74)
            r_lbl = p_kw.add_run("关键词：")
            _set_run_font(r_lbl, cn_font="黑体", size_pt=11.5, bold=True)
            r_val = p_kw.add_run("；".join(keywords))
            _set_run_font(r_val, cn_font="宋体", size_pt=11.5)

        for ch in chapters:
            _add_styled_paragraph(
                doc,
                strip_emojis(ch.get("title", "未命名章节")),
                cn_font="黑体",
                size_pt=14,
                bold=True,
                space_before_pt=12,
                space_after_pt=6,
            )
            body = strip_emojis(ch.get("content") or "").strip()
            if body:
                for raw_line in body.splitlines():
                    ln = raw_line.strip()
                    if not ln:
                        continue
                    if ln.startswith("### "):
                        _add_styled_paragraph(doc, ln[4:].strip(), cn_font="黑体", size_pt=12, bold=True, space_before_pt=8, space_after_pt=4)
                    elif ln.startswith("## "):
                        _add_styled_paragraph(doc, ln[3:].strip(), cn_font="黑体", size_pt=13, bold=True, space_before_pt=10, space_after_pt=4)
                    elif ln.startswith("> "):
                        _add_styled_paragraph(doc, ln[2:].strip(), cn_font="楷体", size_pt=11, left_indent_cm=0.8, space_after_pt=4, color_rgb=(68, 64, 60))
                    else:
                        clean_ln = re.sub(r'\*\*([^*]+)\*\*', r'\1', ln)
                        _add_styled_paragraph(doc, clean_ln, cn_font="宋体", size_pt=12, first_line_indent_cm=0.74)
            else:
                if ch.get("summary"):
                    _add_styled_paragraph(doc, f"【本章论证提要】{strip_emojis(ch['summary'])}", cn_font="楷体", size_pt=11, left_indent_cm=0.6, color_rgb=(100, 90, 80))
                for sec in ch.get("sections") or []:
                    _add_styled_paragraph(doc, strip_emojis(sec), cn_font="黑体", size_pt=12, bold=True, space_before_pt=6, space_after_pt=3)
                    _add_styled_paragraph(doc, "（本节正文待续写）", cn_font="宋体", size_pt=11, first_line_indent_cm=0.74, color_rgb=(140, 140, 140))

    # 参考文献（GB/T 7714-2015）
    _add_styled_paragraph(doc, "参考文献", cn_font="黑体", size_pt=14, bold=True, space_before_pt=14, space_after_pt=6)
    ref_items = citations if citations else [
        {"gbt7714": "朱熹. 四书章句集注[M]. 北京: 中华书局, 2011."},
        {"gbt7714": "黎靖德, 编. 朱子语类[M]. 北京: 中华书局, 1986."},
    ]
    for idx, c in enumerate(ref_items, start=1):
        gbt = strip_emojis(c.get("gbt7714") or format_gbt7714(c.get("book_title", ""), c.get("author", "")))
        _add_styled_paragraph(doc, f"[{idx}] {gbt}", cn_font="宋体", size_pt=10.5, space_after_pt=3, line_spacing=1.35)

    # 附录：武夷学院逸夫图书馆特藏索书号对照表
    if citations:
        _add_styled_paragraph(doc, "附录：武夷学院逸夫图书馆特藏索书号对照表", cn_font="黑体", size_pt=13, bold=True, space_before_pt=12, space_after_pt=6)
        ctbl = doc.add_table(rows=len(citations) + 1, cols=5)
        ctbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        _set_table_borders(ctbl, "B5A695")
        headers = ("序号", "典籍题名", "著者", "OPAC 索书号", "馆藏地")
        for c_i, h in enumerate(headers):
            p = ctbl.rows[0].cells[c_i].paragraphs[0]
            r = p.add_run(h)
            _set_run_font(r, cn_font="黑体", size_pt=10, bold=True)
        for idx, c in enumerate(citations, start=1):
            vals = (
                str(idx),
                strip_emojis(c.get("book_title", "")),
                strip_emojis(c.get("author", "")),
                str(c.get("call_number", "-")),
                strip_emojis(c.get("location", "逸夫图书馆特藏室")),
            )
            for c_i, v in enumerate(vals):
                p = ctbl.rows[idx].cells[c_i].paragraphs[0]
                r = p.add_run(v)
                _set_run_font(r, cn_font="宋体", size_pt=9.5)

    # 审稿意见附栏
    if review and review.get("mentor_verdict"):
        _add_styled_paragraph(doc, "考亭导师评审意见", cn_font="黑体", size_pt=13, bold=True, space_before_pt=12, space_after_pt=6)
        _add_styled_paragraph(
            doc,
            f"综合评分：{review.get('overall_score', '-')} 分（{strip_emojis(review.get('grade', ''))}）",
            cn_font="黑体",
            size_pt=11,
            bold=True,
        )
        _add_styled_paragraph(doc, strip_emojis(review.get("mentor_verdict", "")), cn_font="楷体", size_pt=11.5, first_line_indent_cm=0.74)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()

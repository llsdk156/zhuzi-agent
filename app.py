# -*- coding: utf-8 -*-
"""
朱子文化特色智能体服务主程序 (FastAPI Main Application)
"""

import os
import sys
import json
import random
import time
import re
import hashlib
import asyncio
from collections import OrderedDict
from typing import Optional, List, Dict, Any
from urllib.parse import quote

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    from dotenv import load_dotenv
    _ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(_ENV_FILE):
        load_dotenv(_ENV_FILE, override=False)
except ImportError:
    pass

try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    HAS_EDGE_TTS = False

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, Response
from pydantic import BaseModel

from rag.rag_service import rag_service, is_valid_corpus_filename
from core.agent_engine import zhuzi_agent
from core.document_analyzer import extract_document_text
from core.opac_service import opac_service
from core import thesis_service
from api.supernova_adapter import router as supernova_router

app = FastAPI(
    title="云起武夷·活水传理--朱熹文化",
    description="基于宋代理学大师朱熹原典文献与治学工夫构建，纯第一人称古今结合传道解惑",
    version="1.1.0"
)

# 允许跨域请求（避免 wildcard 与 allow_credentials=True 冲突）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册超新星/超星及 OpenAI 兼容路由
app.include_router(supernova_router)

# 静态资源目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_DIR, exist_ok=True)

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}

MAX_CORPUS_UPLOAD_BYTES = 5 * 1024 * 1024     # 5 MB
MAX_ANALYZE_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB


# ==========================================
# 核心对话与检索接口
# ==========================================

class ChatQueryRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = None
    session_id: Optional[str] = "default"
    stream: Optional[bool] = False
    mode: Optional[str] = None
    temperature: Optional[float] = 0.72


@app.post("/api/chat", summary="书院问对同步接口")
async def api_chat(req: ChatQueryRequest):
    query_text = (req.query or "").strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="提问内容不可为空")

    sid = (req.session_id or "default").strip() or "default"
    temp = req.temperature if req.temperature is not None else 0.72

    if req.stream:
        print(f"\n>>> [学者来访·流式POST(/api/chat)] 会话:{sid} | 模式:{req.mode} | 提问:{query_text[:60]}")
        return StreamingResponse(
            zhuzi_agent.chat_stream(query_text, history=req.history, session_id=sid, mode=req.mode, temperature=temp),
            media_type="text/event-stream",
            headers=SSE_HEADERS,
        )

    print(f"\n>>> [学者来访·同步] 会话:{sid} | 模式:{req.mode} | 提问:{query_text[:60]}")
    res = await asyncio.to_thread(
        zhuzi_agent.chat,
        query_text,
        req.history,
        sid,
        req.mode,
        temp,
    )
    reply_preview = (res.get("reply") or "")[:60]
    print(f"<<< [朱子答复] 引擎:{res.get('provider')} | 内容:{reply_preview}...")
    return res


@app.get("/api/chat/stream", summary="书院问对 SSE 流式接口 (GET)")
async def api_chat_stream_get(
    q: str = Query(..., description="学者提问"),
    session_id: str = Query("default", description="会话标识"),
    mode: Optional[str] = Query(None, description="对话模式"),
):
    query_text = (q or "").strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="提问内容不可为空")
    sid = (session_id or "default").strip() or "default"
    print(f"\n>>> [学者来访·流式GET] 会话:{sid} | 提问:{query_text[:60]}")
    return StreamingResponse(
        zhuzi_agent.chat_stream(query_text, session_id=sid, mode=mode),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@app.post("/api/chat/stream", summary="书院问对 SSE 流式接口 (POST)")
async def api_chat_stream_post(req: ChatQueryRequest):
    query_text = (req.query or "").strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="提问内容不可为空")
    sid = (req.session_id or "default").strip() or "default"
    temp = req.temperature if req.temperature is not None else 0.72
    print(f"\n>>> [学者来访·流式POST] 会话:{sid} | 模式:{req.mode} | 提问:{query_text[:60]}")
    return StreamingResponse(
        zhuzi_agent.chat_stream(query_text, history=req.history, session_id=sid, mode=req.mode, temperature=temp),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


class ChatStopRequest(BaseModel):
    session_id: str


@app.post("/api/chat/stop", summary="停止指定会话流式生成")
async def api_chat_stop(req: ChatStopRequest):
    sid = (req.session_id or "").strip()
    if not sid:
        raise HTTPException(status_code=400, detail="session_id 不可为空")
    print(f"\n>>> [学者令止·停止输出] 会话:{sid}")
    zhuzi_agent.stop_session(sid)
    return {
        "code": 200,
        "message": "已成功下发停止生成指令",
        "session_id": sid
    }


# ==========================================
# 知识库状态与特色文献管理接口
# ==========================================

@app.get("/api/knowledge/stats", summary="获取朱子典籍知识库状态")
async def get_knowledge_stats():
    return rag_service.get_stats()


@app.get("/api/knowledge/search", summary="知识库原始典籍检索测试")
async def search_knowledge(q: str = Query(..., description="检索关键词"), top_k: int = Query(3, ge=1, le=10)):
    return rag_service.search(q, top_k=top_k)


def get_book_key_for_source(source: str) -> str:
    s = (source or "").lower()
    if "诗集传" in s or "诗经" in s:
        return "shijizhuan"
    if "诗和远方" in s or "诗词" in s:
        return "wuyi_shici"
    if "朝圣" in s or "五夫" in s:
        return "wuyi_chaosheng"
    if "考亭论坛" in s or "第二届考亭" in s:
        return "wuyi_kaoting"
    if "海外" in s:
        return "wuyi_haiwai"
    if "政和" in s or "朱子三代" in s:
        return "wuyi_zhenghe"
    if "世纪" in s or "协同创新" in s:
        return "wuyi_century"
    if "大学" in s:
        return "daxue"
    if "中庸" in s:
        return "zhongyong"
    if "论语" in s:
        return "lunyu"
    if "孟子" in s:
        return "mengzi"
    if "近思录" in s:
        return "jinsi"
    if "语类" in s or "语录" in s:
        return "yulei"
    if "文集" in s or "晦庵" in s:
        return "huian"
    if "棹歌" in s:
        return "zhaoge"
    if "白鹿" in s or "学规" in s:
        return "xuegui"
    if "童蒙" in s:
        return "tongmeng"
    if "家训" in s or "格言" in s:
        return "jiaxun"
    if "周易" in s or "易本义" in s:
        return "zhouyi"
    if "通鉴" in s or "纲目" in s:
        return "gangmu"
    if "楚辞" in s:
        return "chuci"
    return "sishu"


def format_canonical_book_title(source: str) -> str:
    """将语料源文件名映射为规范、庄重且地道的典籍题名"""
    if not source:
        return "《考亭典籍》"
    s = source.replace(".txt", "").replace(".md", "")
    s = re.sub(r'^\d+_', '', s).strip()

    if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', s):
        return "《考亭典籍》"

    if "诗和远方" in s:
        return "《朱子的诗和远方》"
    if "朝圣朱子" in s:
        return "《朝圣朱子》"
    if "朱子文化在海外" in s or "海外" in s:
        return "《朱子文化在海外》"
    if "考亭论坛" in s:
        return "《第二届考亭论坛专辑》"
    if "朱子三代与政和" in s or "政和" in s:
        return "《朱子三代与政和》"
    if "世纪之交" in s:
        return "《世纪之交的朱子学》"

    if "四书章句集注" in s:
        if "中庸" in s:
            return "《四书章句集注·中庸章句》"
        if "大学" in s:
            return "《四书章句集注·大学章句》"
        return "《四书章句集注》"
    if "朱子语类" in s:
        m = re.search(r'(卷[一二三四五六七八九十百\d]+)', s)
        if m:
            return f"《朱子语类·{m.group(1)}》"
        if "性理" in s:
            return "《朱子语类·性理总义》"
        if "读书法" in s:
            return "《朱子语类·读书法》"
        if "大学大义" in s:
            return "《朱子语类·大学讲筵》"
        if "中庸心法" in s:
            return "《朱子语类·中庸总卷》"
        if "武夷精舍" in s or "讲筵" in s:
            return "《朱子语类·门人问答》"
        return "《朱子语类》"
    if "近思录" in s:
        m = re.search(r'(卷[一二三四五六七八九十百\d]+)', s)
        if m:
            return f"《近思录·{m.group(1)}》"
        return "《近思录》"
    if "文集" in s or "晦庵" in s:
        return "《晦庵先生朱文公文集》"
    if "棹歌" in s:
        return "《武夷九曲棹歌与精舍杂咏》"
    if "白鹿" in s:
        return "《白鹿洞书院学规》"
    if "童蒙" in s:
        return "《童蒙须知》"
    if "家训" in s or "格言" in s:
        return "《朱子治家格言与家训》"

    parts = s.split('_')
    title = parts[0].strip()
    return f"《{title}》" if not title.startswith("《") else title


def extract_chapter_name(chunk_content: str, source: str) -> str:
    """智能提取章节或卷次名称"""
    chap_match = re.search(r'#{1,3}\s*([^\n]+)', chunk_content)
    if chap_match:
        c = re.sub(r'[*_`#]', '', chap_match.group(1)).strip()
        if c:
            return c
    parts = source.replace(".txt", "").replace(".md", "").split('_')
    if len(parts) > 1:
        c = parts[1].strip()
        if c and not c.startswith("完整全本"):
            return c
    return "原典精选卷次"


@app.get("/api/corpus/search", summary="考亭典籍考据精确检索引擎")
async def api_corpus_search(q: str = Query(..., description="考据字词"), limit: int = Query(15, ge=1, le=50)):
    kw = (q or "").strip()
    if not kw:
        return {"query": q, "total": 0, "results": []}

    results = []
    seen_doc_ids = set()

    # 1. 优先原典字句精准包含匹配（按 doc_id 去重）
    for chunk in rag_service.chunks:
        if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', chunk.source):
            continue
        if kw in chunk.content:
            if chunk.doc_id in seen_doc_ids:
                continue
            seen_doc_ids.add(chunk.doc_id)

            pos = chunk.content.find(kw)
            start = max(0, pos - 45)
            end = min(len(chunk.content), pos + len(kw) + 130)
            snip = chunk.content[start:end].replace("\n", " ").strip()

            book_title = format_canonical_book_title(chunk.source)
            chapter = extract_chapter_name(chunk.content, chunk.source)
            b_key = get_book_key_for_source(chunk.source)

            results.append({
                "book_title": book_title,
                "chapter": chapter,
                "snippet": snip,
                "book_key": b_key,
                "section": chapter,
                "filename": chunk.source
            })
            if len(results) >= limit:
                break

    # 2. 若精确包含不足，结合倒排索引 BM25 补充检索
    if len(results) < limit:
        bm25_matches = rag_service.search(kw, top_k=limit * 2)
        for m in bm25_matches:
            doc_id = m.get("doc_id")
            if doc_id in seen_doc_ids:
                continue
            src = m.get("source", "")
            if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', src):
                continue
            content = m.get("content", "")
            if not content:
                continue
            seen_doc_ids.add(doc_id)

            snip = content[:180].replace("\n", " ").strip()
            book_title = format_canonical_book_title(src)
            title = m.get("title", "")
            chapter = extract_chapter_name(content, src) if not title or title == src else title
            b_key = get_book_key_for_source(src)

            results.append({
                "book_title": book_title,
                "chapter": chapter,
                "snippet": snip,
                "book_key": b_key,
                "section": chapter,
                "filename": src
            })
            if len(results) >= limit:
                break

    return {
        "query": q,
        "total": len(results),
        "results": results
    }


@app.post("/api/custom_corpus/upload", summary="上传用户特色朱子文献")
async def upload_custom_corpus(file: UploadFile = File(...)):
    """接收用户提供的特色文献（.txt, .md），严格防路径穿越并完成即时重索引"""
    raw_name = (file.filename or "").strip()
    if not raw_name or "/" in raw_name or "\\" in raw_name or ".." in raw_name:
        raise HTTPException(status_code=400, detail="文件名非法，不允许包含路径符号")

    safe_name = os.path.basename(raw_name)
    if not is_valid_corpus_filename(safe_name):
        raise HTTPException(
            status_code=400,
            detail="目前仅支持标准命名的 .txt 或 .md 文本文件（不可隐藏文件或 README 开头）。"
        )

    content_bytes = await file.read()
    if len(content_bytes) > MAX_CORPUS_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="文献文件过大，单文件上限为 5 MB。")

    text_content = None
    for enc in ("utf-8", "utf-8-sig", "gb18030", "gbk"):
        try:
            text_content = content_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text_content is None:
        raise HTTPException(status_code=400, detail="文件编码无法识别，请确保为 UTF-8 或 GBK 编码文本。")

    try:
        total_chunks = await asyncio.to_thread(rag_service.add_custom_document, safe_name, text_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "code": 200,
        "message": f"特色文献《{safe_name}》上传并索引成功！",
        "filename": safe_name,
        "char_count": len(text_content),
        "total_chunks_now": total_chunks
    }


@app.post("/api/document/analyze", summary="文献与图片深度识读剖析接口")
async def analyze_document_or_image(file: UploadFile = File(...)):
    """接收文本/文档/图片，调用大模型进行单次深度义理剖析并直接返回分析结果（杜绝二次套娃调用）"""
    raw_name = os.path.basename((file.filename or "").strip())
    if not raw_name:
        raise HTTPException(status_code=400, detail="未检测到有效文件名")

    fn = raw_name.lower()
    content_bytes = await file.read()
    if not content_bytes:
        raise HTTPException(status_code=400, detail="上传文件为空")
    if len(content_bytes) > MAX_ANALYZE_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="上传文件超过 10 MB 限制，请压缩后重试")

    # 1. 图片格式识别
    image_mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
    }
    for ext, mime_type in image_mime_map.items():
        if fn.endswith(ext):
            analysis, is_fallback = await asyncio.to_thread(
                zhuzi_agent.analyze_image_with_glm, content_bytes, mime_type
            )
            return {
                "code": 200,
                "filename": raw_name,
                "type": "image",
                "user_summary": f"📷 已呈交古籍图画墨宝《{raw_name}》，恭请先生即物穷理朱砂手批。",
                "analysis": analysis,
                "fallback": is_fallback,
                "prompt": f"弟子呈上古籍图画墨宝《{raw_name}》，请先生朱砂手批考释。"
            }

    # 2. 文本与文档格式提取（统一接入 core/document_analyzer.py）
    if not fn.endswith((".txt", ".md", ".docx", ".pdf")):
        raise HTTPException(
            status_code=400,
            detail="目前支持格式：TXT、MD、DOCX、PDF 文档以及 PNG、JPG、WEBP、BMP 图像"
        )

    text_content = await asyncio.to_thread(extract_document_text, raw_name, content_bytes)
    if not text_content or not text_content.strip():
        raise HTTPException(
            status_code=400,
            detail=f"未能从《{raw_name}》提取出有效文字（若为扫描版图片 PDF，请截图后点击📷识图或转为 TXT/DOCX 上传）。"
        )

    analysis, is_fallback = await asyncio.to_thread(
        zhuzi_agent.analyze_document_with_glm, raw_name, text_content
    )
    return {
        "code": 200,
        "filename": raw_name,
        "type": "document",
        "char_count": len(text_content),
        "user_summary": f"📄 已呈交研习文献《{raw_name}》（{len(text_content)} 字），恭请先生四维理学朱砂手批。",
        "analysis": analysis,
        "fallback": is_fallback,
        "prompt": f"弟子呈上文献《{raw_name}》，请先生朱砂手批指点。"
    }


@app.get("/api/model/status", summary="当前大模型驱动状态")
async def get_model_status():
    return {
        "provider": "智谱清言 GLM 官方免费模型",
        "has_api_key": bool(zhuzi_agent.api_key),
        "text_model": zhuzi_agent.llm_model,
        "vision_model": zhuzi_agent.vision_model,
        "api_base_url": zhuzi_agent.api_base_url,
        "is_cloud_free": True
    }


@app.post("/api/knowledge/reload", summary="全量重载并更新朱子典籍知识库")
async def reload_knowledge_base():
    await asyncio.to_thread(rag_service.load_all_corpora)
    stats = rag_service.get_stats()
    return {
        "code": 200,
        "message": f"知识库已成功全量更新！收录段落分块: {stats['total_chunks']}，经典电子书: {stats['ebooks_download_count']}本，特色文献: {stats['base_corpus_count']}篇。",
        "stats": stats
    }


# ==========================================
# 典籍与特色文献正文全文阅读接口（严格防路径穿越）
# ==========================================

def _is_safe_corpus_path(candidate: str, allowed_dirs: List[str]) -> bool:
    if not candidate:
        return False
    real_target = os.path.realpath(candidate)
    if not os.path.isfile(real_target):
        return False
    if not real_target.lower().endswith((".txt", ".md")):
        return False
    for d in allowed_dirs:
        real_d = os.path.realpath(d)
        if real_target.startswith(real_d + os.sep):
            return True
    return False


def resolve_book_path(book_key: Optional[str], filename: Optional[str] = None, title: Optional[str] = None) -> Optional[str]:
    base_dir = os.path.join(BASE_DIR, "data", "base_corpus")
    ebooks_dir = os.path.join(BASE_DIR, "data", "ebooks_download")
    arch_dir = os.path.join(BASE_DIR, "data", "archive_legacy_base_corpus")
    custom_dir = os.path.join(BASE_DIR, "data", "custom_corpus")
    allowed_dirs = [ebooks_dir, base_dir, arch_dir, custom_dir]

    # 1. 安全校验 filename，杜绝 ../../.env 任意文件读取
    if filename:
        raw_fn = filename.strip()
        if ".." in raw_fn or "/" in raw_fn or "\\" in raw_fn:
            raise HTTPException(status_code=400, detail="非法文献路径参数")
        clean_fn = os.path.basename(raw_fn).replace("《", "").replace("》", "")
        if not clean_fn or clean_fn.startswith("."):
            raise HTTPException(status_code=400, detail="非法文献文件名")

        for d in allowed_dirs:
            if not os.path.exists(d):
                continue
            p = os.path.join(d, clean_fn)
            if _is_safe_corpus_path(p, allowed_dirs):
                return os.path.realpath(p)
            if not clean_fn.endswith((".txt", ".md")):
                p_txt = os.path.join(d, clean_fn + ".txt")
                if _is_safe_corpus_path(p_txt, allowed_dirs):
                    return os.path.realpath(p_txt)
            for cand in os.listdir(d):
                if not is_valid_corpus_filename(cand):
                    continue
                if clean_fn in cand or cand.replace(".txt", "") in clean_fn:
                    p_cand = os.path.join(d, cand)
                    if _is_safe_corpus_path(p_cand, allowed_dirs):
                        return os.path.realpath(p_cand)

    # 2. 按题名匹配
    if title:
        clean_t = title.strip().replace("《", "").replace("》", "").replace("考亭理学", "朱子学")
        for d in allowed_dirs:
            if not os.path.exists(d):
                continue
            for cand in os.listdir(d):
                if not is_valid_corpus_filename(cand):
                    continue
                if clean_t in cand or any(part in cand for part in clean_t.split("_") if len(part) >= 3):
                    p_cand = os.path.join(d, cand)
                    if _is_safe_corpus_path(p_cand, allowed_dirs):
                        return os.path.realpath(p_cand)

    bk = (book_key or "daxue").lower().strip()
    if ".." in bk or "/" in bk or "\\" in bk:
        raise HTTPException(status_code=400, detail="非法典籍标识")

    exact_map = {
        "sishu": os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt"),
        "daxue": os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt"),
        "zhongyong": os.path.join(ebooks_dir, "四书章句集注_中庸章句_完整全本.txt"),
        "lunyu": os.path.join(arch_dir, "01_四书章句集注_大学中庸精粹.txt"),
        "mengzi": os.path.join(arch_dir, "01_四书章句集注_大学中庸精粹.txt"),
        "jinsi": os.path.join(ebooks_dir, "近思录_全十四卷_朱熹吕祖谦编_完整全本.txt"),
        "daoti": os.path.join(ebooks_dir, "近思录_卷一_道体_朱熹吕祖谦编_完整全本.txt"),
        "jinsi_all": os.path.join(ebooks_dir, "近思录_全十四卷_朱熹吕祖谦编_完整全本.txt"),
        "yulei": os.path.join(ebooks_dir, "朱子语类_性理总义卷_仁义礼智与性情心意_完整全本.txt"),
        "zhuzi_yulei": os.path.join(ebooks_dir, "朱子语类_性理总义卷_仁义礼智与性情心意_完整全本.txt"),
        "liqi": os.path.join(ebooks_dir, "朱子语类_卷一_理气上天地上_完整全本.txt"),
        "yulei_liqi": os.path.join(ebooks_dir, "朱子语类_卷一_理气上天地上_完整全本.txt"),
        "yulei_xingqi": os.path.join(ebooks_dir, "朱子语类_卷二_理气下人物之性气_完整全本.txt"),
        "yulei_xue": os.path.join(ebooks_dir, "朱子语类_读书法与知行并进总义卷_完整全本.txt"),
        "sixfa": os.path.join(ebooks_dir, "朱子语类_读书法与知行并进总义卷_完整全本.txt"),
        "reading_methods": os.path.join(ebooks_dir, "朱子语类_读书法与知行并进总义卷_完整全本.txt"),
        "yulei_daxue": os.path.join(ebooks_dir, "朱子语类_大学大义讲筵总卷_完整全本.txt"),
        "yulei_zhongyong": os.path.join(ebooks_dir, "朱子语类_中庸心法与天命天道总卷_完整全本.txt"),
        "yulei_wuyi": os.path.join(ebooks_dir, "朱子语类_武夷精舍考亭书院讲筵与门人问答总卷_完整全本.txt"),
        "tongmeng": os.path.join(ebooks_dir, "童蒙须知_朱子儿童修养与进退规矩_完整全本.txt"),
        "jiaxun": os.path.join(ebooks_dir, "朱子治家格言与家训_完整全本.txt"),
        "bailu": os.path.join(ebooks_dir, "白鹿洞书院学规_完整全本.txt"),
        "bailudong": os.path.join(ebooks_dir, "白鹿洞书院学规_完整全本.txt"),
        "xuegui": os.path.join(ebooks_dir, "白鹿洞书院学规_完整全本.txt"),
        "zhaoge": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "wuyi_poems": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "wuyi_records": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "wuyi_dongjing": os.path.join(ebooks_dir, "朱子语类_武夷精舍考亭书院讲筵与门人问答总卷_完整全本.txt"),
        "huian": os.path.join(ebooks_dir, "晦庵先生朱文公文集_考亭书院规约与名篇全集.txt"),
        "wenji": os.path.join(ebooks_dir, "晦庵先生朱文公文集_考亭书院规约与名篇全集.txt"),
        # 理学旁涉经典（映射到馆内对应最贴近全本或理气卷）
        "taiji": os.path.join(ebooks_dir, "近思录_卷一_道体_朱熹吕祖谦编_完整全本.txt"),
        "ximing": os.path.join(ebooks_dir, "近思录_全十四卷_朱熹吕祖谦编_完整全本.txt"),
        "gangmu": os.path.join(ebooks_dir, "晦庵先生朱文公文集_考亭书院规约与名篇全集.txt"),
        "shijizhuan": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "zhouyi": os.path.join(ebooks_dir, "朱子语类_卷一_理气上天地上_完整全本.txt"),
        "chuci": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        # 武夷学院特色文献专著库
        "wuyi_kaoting": os.path.join(base_dir, "05_第二届考亭论坛专辑_融通朱子文化夯实文明根基.txt"),
        "05_kaotingluntan": os.path.join(base_dir, "05_第二届考亭论坛专辑_融通朱子文化夯实文明根基.txt"),
        "kaoting_forum": os.path.join(base_dir, "05_第二届考亭论坛专辑_融通朱子文化夯实文明根基.txt"),
        "wuyi_chaosheng": os.path.join(base_dir, "03_朝圣朱子_武夷山五夫故里特色专著.txt"),
        "03_chaoshengzhuzi": os.path.join(base_dir, "03_朝圣朱子_武夷山五夫故里特色专著.txt"),
        "wuyi_pilgrim": os.path.join(base_dir, "03_朝圣朱子_武夷山五夫故里特色专著.txt"),
        "wuyi_haiwai": os.path.join(base_dir, "04_朱子文化在海外_东亚与欧美传播谱系.txt"),
        "04_haiwai": os.path.join(base_dir, "04_朱子文化在海外_东亚与欧美传播谱系.txt"),
        "wuyi_overseas": os.path.join(base_dir, "04_朱子文化在海外_东亚与欧美传播谱系.txt"),
        "wuyi_shici": os.path.join(base_dir, "02_朱子的诗和远方_武夷山水理学诗歌专著.txt"),
        "02_shideyuangfang": os.path.join(base_dir, "02_朱子的诗和远方_武夷山水理学诗歌专著.txt"),
        "wuyi_poetry": os.path.join(base_dir, "02_朱子的诗和远方_武夷山水理学诗歌专著.txt"),
        "wuyi_century": os.path.join(base_dir, "01_世纪之交的朱子学_朱子文化协同创新文丛.txt"),
        "wuyi_chuangxin": os.path.join(base_dir, "01_世纪之交的朱子学_朱子文化协同创新文丛.txt"),
        "01_shijizhijiao": os.path.join(base_dir, "01_世纪之交的朱子学_朱子文化协同创新文丛.txt"),
        "wuyi_fujian": os.path.join(base_dir, "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt"),
        "wuyi_zhenghe": os.path.join(base_dir, "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt"),
        "06_zhenghe": os.path.join(base_dir, "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt"),
    }

    if bk in exact_map and _is_safe_corpus_path(exact_map[bk], allowed_dirs):
        return os.path.realpath(exact_map[bk])

    for d in allowed_dirs:
        if not os.path.exists(d):
            continue
        for cand in os.listdir(d):
            if not is_valid_corpus_filename(cand):
                continue
            cand_lower = cand.lower()
            if bk in cand_lower or any(part in cand_lower for part in bk.split("_") if len(part) >= 2):
                p_cand = os.path.join(d, cand)
                if _is_safe_corpus_path(p_cand, allowed_dirs):
                    return os.path.realpath(p_cand)

    default_p = os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt")
    if _is_safe_corpus_path(default_p, allowed_dirs):
        return os.path.realpath(default_p)
    return None


@app.get("/api/book/content", summary="获取典籍或特色文献的具体正文与章节内容")
async def get_book_content(
    book_key: Optional[str] = Query(None, description="典籍唯一ID"),
    filename: Optional[str] = Query(None, description="文献文件名"),
    title: Optional[str] = Query(None, description="典籍题名")
):
    abs_path = resolve_book_path(book_key, filename, title)
    if not abs_path or not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="未找到对应典籍正文内容")

    with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_content = f.read()

    # 清洗古籍语料中偶见的维基文库“[ 编辑 ]”爬取残留标记
    raw_content = re.sub(r'\[\s*编辑\s*\]', '', raw_content)
    raw_content = re.sub(r'\n{3,}', '\n\n', raw_content)

    lines = raw_content.split("\n")
    title_res = os.path.basename(abs_path).replace(".txt", "").replace(".md", "")
    chapters = []
    curr_title = "卷首与引言"
    curr_lines: List[str] = []
    md_chap_re = re.compile(r'^(#{1,4})\s+(.+)$')
    cn_chap_re = re.compile(
        r'^(?:'
        r'第[一二三四五六七八九十百零〇两0-9]+[章卷回节篇讲目][^\n]{0,30}'
        r'|卷[之]?[一二三四五六七八九十百零〇0-9]+[^\n]{0,30}'
        r'|经一章[^\n]{0,20}|传之[^\n]{0,24}|(?:自序|序言|原序|前言|引言|导言|后记|跋)'
        r')$'
    )

    for line in lines:
        stripped = line.strip()
        m_md = md_chap_re.match(stripped)
        if m_md:
            level = len(m_md.group(1))
            ch_title = m_md.group(2).strip()
            if level == 1 and not chapters and not curr_lines:
                title_res = ch_title
                continue
            if any(x.strip() for x in curr_lines):
                chapters.append({"title": curr_title, "content": "\n".join(curr_lines).strip()})
            curr_title = ch_title
            curr_lines = []
        elif stripped and len(stripped) <= 36 and cn_chap_re.match(stripped):
            if any(x.strip() for x in curr_lines):
                chapters.append({"title": curr_title, "content": "\n".join(curr_lines).strip()})
            curr_title = stripped
            curr_lines = []
        else:
            curr_lines.append(line)

    if any(x.strip() for x in curr_lines):
        chapters.append({"title": curr_title, "content": "\n".join(curr_lines).strip()})

    return {
        "book_key": book_key,
        "title": title_res,
        "filename": os.path.basename(abs_path),
        "full_text": raw_content,
        "char_count": len(raw_content),
        "chapters": chapters
    }


@app.get("/api/book/list", summary="获取知识库中全部可阅读典籍列表")
async def list_available_books():
    stats = rag_service.get_stats()
    return {
        "base_corpus": stats["base_files"],
        "ebooks": stats["ebooks_files"],
        "total_books": len(stats["base_files"]) + len(stats["ebooks_files"]),
        "total_chunks": stats["total_chunks"]
    }


# ==========================================
# 考亭考校堂试题与研学评卷接口（选项乱序 + 防缺答满分 + 去重书名号）
# ==========================================

QUIZ_BANK_PATH = os.path.join(BASE_DIR, "data", "quiz_bank.json")
_cached_quiz_bank = None


def load_quiz_bank() -> List[Dict[str, Any]]:
    global _cached_quiz_bank
    if _cached_quiz_bank is not None:
        return _cached_quiz_bank
    if os.path.exists(QUIZ_BANK_PATH):
        try:
            with open(QUIZ_BANK_PATH, "r", encoding="utf-8") as f:
                _cached_quiz_bank = json.load(f)
                return _cached_quiz_bank
        except Exception as e:
            print(f"[Quiz] 读取试题库异常: {e}")
    return []


@app.get("/api/quiz/questions", summary="获取考亭考校试题")
async def get_quiz_questions(
    category: Optional[str] = Query("all", description="试题分类"),
    limit: Optional[int] = Query(5, description="试题数量"),
    random_sample: Optional[bool] = Query(True, description="是否随机乱序抽取")
):
    bank = load_quiz_bank()
    if not bank:
        return {"questions": [], "total": 0, "category": category}

    filtered = bank
    cat = (category or "all").strip()
    if cat and cat != "all":
        filtered = [
            q for q in bank
            if q.get("category") == cat or q.get("category_id") == cat or cat in q.get("category", "")
        ]
        if not filtered:
            filtered = bank

    lim = limit if limit and limit > 0 else 5
    chosen = random.sample(filtered, lim) if (random_sample and len(filtered) > lim) else filtered[:lim]

    client_questions = []
    for q in chosen:
        raw_opts = list(q.get("options") or [])
        indexed = list(enumerate(raw_opts))
        if random_sample and len(indexed) > 1:
            random.shuffle(indexed)
        shuffled_opts = [txt for _, txt in indexed]
        option_indices = [orig_i for orig_i, _ in indexed]

        client_questions.append({
            "id": q.get("id"),
            "category_id": q.get("category_id"),
            "category": q.get("category"),
            "question": q.get("question"),
            "options": shuffled_opts,
            "option_indices": option_indices,  # 前端提交该选项对应的原下标，彻底打破全选 A 拿满分
            "book_title": (q.get("book_title") or "").strip("《》"),
        })

    return {
        "questions": client_questions,
        "total": len(client_questions),
        "category": cat
    }


class QuizSubmitRequest(BaseModel):
    answers: Dict[str, Any]
    question_ids: Optional[List[str]] = None


@app.post("/api/quiz/submit", summary="呈交考校答卷并获取考亭先生朱批")
async def submit_quiz(req: QuizSubmitRequest):
    bank = load_quiz_bank()
    bank_map = {q.get("id"): q for q in bank}

    answers = req.answers or {}
    # 若前端传入完整题单 question_ids，按完整题数计分，杜绝只答 1 题拿 100 分
    eval_ids = list(req.question_ids) if req.question_ids else list(answers.keys())
    if not eval_ids:
        raise HTTPException(status_code=400, detail="答卷内容不能为空")

    correct_count = 0
    details = []

    for q_id in eval_ids:
        q_item = bank_map.get(q_id)
        if not q_item:
            continue
        user_choice = answers.get(q_id)
        try:
            choice_int = int(user_choice) if user_choice is not None else None
        except Exception:
            choice_int = None

        correct_ans = int(q_item.get("answer", 0))
        is_corr = (choice_int == correct_ans)
        if is_corr:
            correct_count += 1

        options = q_item.get("options", [])
        correct_text = options[correct_ans] if 0 <= correct_ans < len(options) else ""
        user_text = options[choice_int] if (choice_int is not None and 0 <= choice_int < len(options)) else "未作答"
        raw_analysis = q_item.get("analysis", "") or q_item.get("explanation", "")
        raw_book = (q_item.get("book_title") or "考亭典籍").strip().strip("《》")
        book_display = f"《{raw_book}》"

        if raw_analysis:
            exp_text = f"【原典精义】：{raw_analysis} 此题正解为“{correct_text}”，出自{book_display}。学者当循序渐进，涵泳笃行。"
        else:
            exp_text = f"考亭先生当堂开示：此题正解为“{correct_text}”，引据{book_display}。学者研读经义，贵在字求其训、反求诸身。"

        details.append({
            "id": q_id,
            "question": q_item.get("question"),
            "user_choice": choice_int,
            "user_answer_text": user_text,
            "correct_choice": correct_ans,
            "correct_answer_text": correct_text,
            "is_correct": is_corr,
            "analysis": exp_text,
            "explanation": exp_text,
            "book_title": book_display,
            "category": q_item.get("category", "")
        })

    total_submitted = len(details)
    score = int(round((correct_count / total_submitted) * 100)) if total_submitted > 0 else 0

    if score == 100:
        rank = "考亭元魁 · 状元及第"
        zhupi = "考亭印可！仁兄深研经传，字求其训、句索其旨，大本已立而条理精微。实乃考亭门下纯儒之英才！"
    elif score >= 80:
        rank = "考亭高弟 · 榜眼及第"
        zhupi = "考亭嘉许！仁兄于理学微旨已窥堂奥，知行之辨条畅通达。但当更下虚心涵泳之功，常加省察。"
    elif score >= 60:
        rank = "进学及格 · 探花登科"
        zhupi = "大体粗备，犹须勉励！学问正如撑上水船，一篙不可放缓。部分字句尚有含糊，当重温四书章句。"
    else:
        rank = "童蒙再砺 · 待加精进"
        zhupi = "未得乎前，不敢求乎后。仁兄切莫急躁求速，当依循序渐进法门，小立课程，微加积叠，端正下死功夫。"

    cert_id = f"KT-{time.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

    return {
        "score": score,
        "correct_count": correct_count,
        "total_count": total_submitted,
        "rank": rank,
        "zhupi_comment": zhupi,
        "details": details,
        "certificate_id": cert_id
    }


# ==========================================
# 考亭尺牍代拟与墨札批复接口（修复误判情书与正文误截）
# ==========================================

class LetterSubmitRequest(BaseModel):
    thought: Optional[str] = ""
    content: Optional[str] = ""


_ROMANTIC_RE = re.compile(
    r'女孩|女生|女子|姑娘|心仪|爱慕|意中人|慕悦|佳人|倾心|表白|情书|暗恋|心动|红颜|窈窕|眷念|思慕|结发|琴瑟|'
    r'喜欢.{0,6}(?:她|女|姑娘|学妹|学姐|同学|人)'
)


def extract_ancient_letter_reply(text: str) -> str:
    if not text:
        return ""
    code_match = re.search(r'```(?:[a-zA-Z]*\n)?(.*?)```', text, re.DOTALL)
    if code_match:
        text = code_match.group(1).strip()

    salutation_keywords = (
        '妆次', '足下', '台鉴', '函丈', '道席', '尊前', '知鉴', '览之', '膝下',
        '铭', '座右', '如晤', '惠鉴', '青睐', '吾儿', '贤侄', '仁兄', '知交', '寄怀', '抒怀'
    )
    lines = [ln.rstrip() for ln in text.split('\n')]
    # 仅在前 4 行扫描开篇称谓，避免误把正文中的“先生尝云：”截成首行
    start_idx = 0
    for i in range(min(4, len(lines))):
        l = lines[i].strip()
        if not l:
            continue
        if (l.endswith('：') or l.endswith(':')) and any(k in l for k in salutation_keywords) and len(l) <= 22:
            start_idx = i
            break
        if any(k in l for k in ('座右自警铭', '自警铭', '日省箴', '座右铭')):
            start_idx = i
            break
    lines = lines[start_idx:]

    signoff_keywords = (
        '谨手拜', '再拜顿首', '顿首再拜', '顿首谨禀', '肃拜谨禀', '手字',
        '谨铭', '谨奉', '谨记', '谨上', '拜覆', '顿首', '谨启', '手笔', '谨拜'
    )
    # 仅在末 4 行扫描落款，防止误截正文
    end_idx = len(lines)
    scan_floor = max(1, len(lines) - 4)
    for i in range(len(lines) - 1, scan_floor - 1, -1):
        l = lines[i].strip()
        if l and any(k in l for k in signoff_keywords) and len(l) <= 22:
            end_idx = i + 1
            break
    text = '\n'.join(lines[:end_idx]).strip()

    text = re.sub(r'📜.*?(?=\n\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'🏛️.*?(?=\n\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'【参考资料】[\s\S]*$', '', text)
    text = re.sub(r'【典籍.*?】.*?(?=\n\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'-{3,}', '', text)
    text = re.sub(r'[\(（][^()（）]*?[\)）]', '', text)
    text = re.sub(r'[\(（\)）]', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text


def _generate_letter_sync(user_thought: str) -> Dict[str, Any]:
    thought_lower = user_thought.lower()
    is_girl_letter = bool(_ROMANTIC_RE.search(thought_lower))

    if is_girl_letter:
        dynamic_seal = "同心<br>存诚"
        dynamic_date = "宋绍熙四年暮春 手书谨寄"
    elif any(k in thought_lower for k in ("同窗", "好友", "朋友", "同门", "仁兄", "同砚", "劝勉", "勉励", "立志读书", "切磋", "砥砺", "共勉")):
        dynamic_seal = "考亭<br>晦翁"
        dynamic_date = "宋绍熙四年暮春 友生顿首再拜"
    elif any(k in thought_lower for k in ("急躁", "浮躁", "浮动", "戒急", "慎独", "主敬", "收敛", "戒躁", "脾气", "冲动", "反省", "克己", "修身", "警策", "座右铭", "自律")):
        dynamic_seal = "主敬<br>存诚"
        dynamic_date = "宋绍熙三年春 敬书于座右以自省"
    elif any(k in thought_lower for k in ("后辈", "晚辈", "子侄", "童蒙", "幼学", "家训", "儿", "侄")):
        dynamic_seal = "考亭<br>晦翁"
        dynamic_date = "宋庆元四年季秋 手书示家塾子侄"
    elif any(k in thought_lower for k in ("师", "先生", "夫子", "请益", "求教", "问难", "受教", "读书法", "四书", "格物", "穷理")):
        dynamic_seal = "受业<br>谨呈"
        dynamic_date = "宋庆元四年暮春 受业门生肃拜谨禀"
    elif any(k in thought_lower for k in ("山", "武夷", "九曲", "游", "景", "茶", "胜景", "自然", "泉", "竹筏", "泛舟")):
        dynamic_seal = "九曲<br>活水"
        dynamic_date = "宋绍熙二年夏 隐屏精舍客次题寄"
    elif any(k in thought_lower for k in ("累", "倦", "怠", "难", "惑", "烦", "学不进", "心杂", "迷茫", "消沉", "挫折")):
        dynamic_seal = "明道<br>安身"
        dynamic_date = "宋淳熙八年长至日 示知己自安手简"
    elif any(k in thought_lower for k in ("家", "乡", "亲", "父母", "慈母", "严父", "故乡")):
        dynamic_seal = "思亲<br>修身"
        dynamic_date = "宋绍熙五年春 客次谨奉家慈"
    else:
        dynamic_seal = "考亭<br>晦翁"
        dynamic_date = "宋绍熙四年暮春 友生顿首再拜"

    reply = ""
    is_fallback = False

    if zhuzi_agent.api_key:
        try:
            system_prompt = (
                "你是一位精通宋代理学文献与宋代文人尺牍传统的手札宗师。\n"
                "请根据问学者的真实意图与写信对象，因题制宜代拟一封意境高古的宋代文人尺牍：\n"
                "1. 严禁千篇一律，根据对象选择恰当体裁与称谓（情简用‘卿卿妆次：’、朋侪用‘仁兄足下：’、自省用‘座右自警铭：’、请益师长用‘考亭夫子函丈：’、寄亲用‘堂上双亲大人膝下：’、山水寄怀用‘同道知交：’）；\n"
                "2. 自然融入主敬涵养、循序渐进、格物穷理等理学风骨；\n"
                "3. 严格排版：首行称谓独占一行，正文 2 至 3 段以空行分隔，末行落款独占一行；\n"
                "4. 直接输出纯手札正文，严禁输出任何前言说明、赏析后记、代码块、圆括号或【参考资料】。"
            )
            if is_girl_letter:
                user_msg = (
                    f"问学者托付的心意为：【{user_thought}】。\n"
                    "写信受众为心仪之女子，请以雅正深情之宋代文人情简代拟，称谓‘卿卿妆次：’，自称‘仆’或‘生’，称对方为‘卿’，直接输出尺牍正文。"
                )
            else:
                user_msg = f"问学者托付的寄语为：\n{user_thought}\n\n请准确研判写信对象与体裁，直接输出一段落分明的宋风尺牍正文。"

            endpoint = f"{zhuzi_agent.api_base_url.rstrip('/')}/chat/completions"
            payload = {
                "model": zhuzi_agent.llm_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                "temperature": 0.72,
                "max_tokens": 800,
            }
            resp_data = zhuzi_agent._post_json(endpoint, payload, timeout=25.0)
            choices = resp_data.get("choices") or []
            raw_reply = ((choices[0].get("message", {}).get("content") or "") if choices else "").strip()
            reply = extract_ancient_letter_reply(raw_reply)
            if is_girl_letter and reply:
                reply = reply.replace("望君", "望卿").replace("想君", "想卿").replace("与君", "与卿").replace("愿君", "愿卿")
        except Exception as e:
            print(f"[Letter] 智谱大模型代拟遇阻，启用内生书信引擎: {e}")

    if not reply or len(reply) < 30:
        is_fallback = True
        if is_girl_letter:
            reply = (
                "卿卿妆次：\n\n"
                "自昔日得睹芳仪，清雅温润，动静合度，虽经月余，寤寐难忘。考亭先生注《周南》尝云：“男女相悦，性情之真，窈窕淑女，君子好逑。”仆虽潜心书史，然见端庄贞静如卿，心实慕之。\n\n"
                "所谓伊人，在水一方。愿修尺素，托武夷活水而遥递深衷。愿得执子之手，同心存诚，琴瑟静好。荒简披沥，伏惟芳照。\n\n"
                "友生 谨手拜"
            )
        elif any(k in thought_lower for k in ("同窗", "好友", "朋友", "同门", "仁兄", "同砚", "劝勉", "勉励", "立志", "共勉")):
            reply = (
                "仁兄足下：\n\n"
                "春和景明，伏惟道履清泰。比闻仁兄研习经义，颇生浮怠之虑。吾辈既投身圣门，当明为学如撑上水船，一篙不可放缓之理。\n\n"
                "考亭先生尝训门人：“学问之功，贵在立志高远，循序渐进。”愿与仁兄共守主敬存诚之规，晨起省察，夜静默涵，切莫虚度锦绣光阴。\n\n"
                "同门生 再拜顿首"
            )
        elif any(k in thought_lower for k in ("急躁", "浮躁", "戒急", "慎独", "主敬", "反省", "克己", "修身", "座右铭", "自律")):
            reply = (
                "座右自警铭：\n\n"
                "心如止水，鉴照无遗；气若浮动，私欲乘隙。\n\n"
                "念起于微，必察其欺；事接于物，必循其理。主敬整躬，收摄放心。宽着期限，紧着工夫。朝夕省察，永矢弗谖。\n\n"
                "后学 谨铭"
            )
        elif any(k in thought_lower for k in ("山", "武夷", "九曲", "游", "景", "茶", "胜景", "泉")):
            reply = (
                "同道知交：\n\n"
                "久仰武夷云水之胜，今岁行游九曲溪山，群峰耸翠，清流潆洄。忆及晦翁先生隐屏结庐、棹歌赋诗，即山水以穷天地之理，心神顿觉澄澈。\n\n"
                "山静而水流，一动一静无非至理流行。愿与知交共守活水清源之志，使日用起居常如九曲澄潭，不染纤尘。\n\n"
                "武夷客次 友生顿首"
            )
        elif any(k in thought_lower for k in ("家", "乡", "亲", "父母", "慈母", "严父", "故乡")):
            reply = (
                "堂上双亲大人膝下：\n\n"
                "客中接得家书，伏悉起居康宁，喜慰何言。游子羁寓武夷，馆课粗毕，勉循程限，不敢虚度光阴。\n\n"
                "儿在此主敬整躬，自爱自重，幸勿挂怀。伏愿双亲保重玉体，顺时节宣。草此附候，叩请金安。\n\n"
                "男 顿首谨上"
            )
        else:
            reply = (
                "仁兄知鉴：\n\n"
                "顷承来示，托付胸中意气，言辞诚悫，足见贤生性情之笃。天地大化，人心之思发而皆中节，自是天理流行。\n\n"
                "学者居敬存养，随处皆有涵泳安顿之所。苟能守其诚、谨其独，则事事皆成学问，日用起居自然天真条畅。谨濡淡墨，略陈鄙臆。\n\n"
                "友生 谨手拜"
            )

    reply = extract_ancient_letter_reply(reply)
    return {
        "reply": reply,
        "date": dynamic_date,
        "seal": dynamic_seal,
        "fallback": is_fallback,
    }


@app.post("/api/letter/submit", summary="考亭尺牍代拟与墨札批复接口")
async def submit_letter(req: LetterSubmitRequest):
    user_thought = (req.thought or req.content or "").strip()
    if not user_thought:
        raise HTTPException(status_code=400, detail="寄托心意不可为空")
    return await asyncio.to_thread(_generate_letter_sync, user_thought)


# ==========================================
# 武夷学院图书馆 OPAC 对接接口（非阻塞 + 并发批量查询）
# ==========================================

class OPACReservationRequest(BaseModel):
    readerName: Optional[str] = None
    reader_name: Optional[str] = None
    readerId: Optional[str] = None
    card_id: Optional[str] = None
    reader_type: Optional[str] = "本科生"
    readerType: Optional[str] = "本科生"
    phone: Optional[str] = ""
    pickupDate: Optional[str] = None
    pickup_date: Optional[str] = None
    pickupLocation: Optional[str] = "逸夫图书馆六楼特藏专区服务台"
    pickup_location: Optional[str] = "逸夫图书馆六楼特藏专区服务台"
    books: List[Dict[str, Any]] = []
    notes: Optional[str] = ""


@app.get("/api/opac/books", summary="获取武夷学院馆藏经典书籍全集数据库")
async def get_opac_books():
    return opac_service.get_all_books()


@app.get("/api/opac/status", summary="查询特定典籍实时在架与可借状态")
async def get_opac_status(
    keyword: Optional[str] = Query(None, description="书名、索书号或典籍ID"),
    book_title: Optional[str] = Query(None, description="书名"),
    force: bool = Query(False, description="是否强制刷新图书馆后台实时数据")
):
    target = (keyword or book_title or "大学章句").strip()
    return await asyncio.to_thread(opac_service.get_live_book_status, target, force)


@app.post("/api/opac/batch-status", summary="批量并发查询典籍实时在架状态")
async def get_opac_batch_status(req: Dict[str, Any]):
    keywords = req.get("titles") or req.get("keywords") or req.get("books") or []
    force = bool(req.get("force", False))
    sem = asyncio.Semaphore(5)

    async def _query_one(kw: str):
        async with sem:
            return kw, await asyncio.to_thread(opac_service.get_live_book_status, str(kw), force)

    pairs = await asyncio.gather(*[_query_one(kw) for kw in keywords[:30]])
    return {"results": dict(pairs), "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")}


@app.post("/api/opac/reserve", summary="提交武夷学院图书馆线下借阅预约单")
async def create_opac_reservation(req: OPACReservationRequest):
    payload = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    pickup_date = payload.get("pickup_date") or payload.get("pickupDate") or time.strftime("%Y-%m-%d")
    payload["readerName"] = payload.get("reader_name") or payload.get("readerName") or "考亭后学"
    payload["readerId"] = payload.get("card_id") or payload.get("readerId") or ""
    payload["pickupDate"] = pickup_date
    payload["pickupLocation"] = payload.get("pickup_location") or payload.get("pickupLocation") or "逸夫图书馆六楼特藏专区服务台"

    record = await asyncio.to_thread(opac_service.create_reservation, payload)
    return {
        "success": True,
        "status": "ok",
        "message": "线下预约申请提交成功！已为您锁定架位",
        "reservation_id": record.get("reservationId"),
        "valid_until": f"{pickup_date} 17:30",
        "reservation": record
    }


@app.get("/api/opac/reservations", summary="获取已提交的线下借阅预约单（已脱敏）")
async def list_opac_reservations(card_id: Optional[str] = Query(None, description="读者学号/借书证号")):
    return {"reservations": opac_service.load_reservations(card_id=card_id, mask_sensitive=True)}


@app.get("/api/opac/accounts", summary="获取已登记读者账号列表（已脱敏）")
async def list_opac_accounts():
    return {"accounts": opac_service.get_known_accounts()}


@app.post("/api/opac/cancel", summary="取消线下借阅预约单")
async def cancel_opac_reservation(req: Dict[str, Any]):
    res_id = str(req.get("reservationId") or req.get("reservation_id") or req.get("id") or "").strip()
    card_id = str(req.get("card_id") or req.get("readerId") or "").strip() or None
    if not res_id:
        raise HTTPException(status_code=400, detail="预约单号不可为空")
    result = await asyncio.to_thread(opac_service.cancel_reservation, res_id, card_id)
    if not result.get("success"):
        status_code = 403 if "无权" in result.get("message", "") else 404
        raise HTTPException(status_code=status_code, detail=result.get("message"))
    return result


# ==========================================
# 朱子语音配音合成接口（防500崩溃 + LRU缓存 + 完整句断句 + iOS兼容）
# ==========================================

VOICE_PROFILES = {
    "yunjian": {
        "name": "zh-CN-YunjianNeural",
        "rate": "-8%",
        "pitch": "-2Hz",
        "title": "考亭大儒 · 苍劲风骨"
    }
}


class TTSRequest(BaseModel):
    text: str
    style: Optional[str] = "yunjian"
    voice: Optional[str] = None


@app.get("/api/tts/voices", summary="获取考亭夫子专属音色")
async def list_literati_voices():
    return {
        "default": "yunjian",
        "voices": [
            {"id": "yunjian", "title": "🎙️ 考亭大儒 · 苍劲风骨（唯一专属声线 · 沉郁温厚大儒气象）", "desc": "沉郁苍劲，抑扬顿挫，深具宋代理学家风骨"}
        ]
    }


def prepare_classical_speech_text(raw_text: str) -> str:
    """对文白夹杂文本进行古韵韵律重构：剔除参考资料、表情符号与 Markdown，完整自然断句"""
    t = raw_text or ""

    # 0. 截除【参考资料】馆藏区块与 OPAC 元数据，避免朗读索书号
    if "【参考资料】" in t:
        t = t.split("【参考资料】", 1)[0]

    # 1. 移除系统注记与常见 emoji
    t = re.sub(r'[\(（][^()（）]{0,60}[\)）]', '', t)
    t = re.sub(r'[📜💡🎯✨🌟🏮🌅☀️🌙🔊🔇🏛️📖📚🎓🔬🌸🍃⛰️🚣🏡⚡🕊️🌾🌊⏳📷📄🔄✅❌🟢🔴📌📍📗•■▶⏸]', '', t)

    # 2. 净化 Markdown 与角标
    t = re.sub(r'[*#>`_~]', '', t)
    t = re.sub(r'【[0-9]{1,2}】|\[[0-9]{1,2}\]', '', t)
    t = re.sub(r'【考亭原典明训】|【考亭典籍考引】', '考亭原典有云：', t)
    t = re.sub(r'【现代白话精析】', '白话精析：', t)
    t = re.sub(r'【切己体察功夫】', '切己功夫：', t)
    t = re.sub(r'【([^】]{1,20})】', r'\1，', t)
    t = re.sub(r'[\[\]\(\)（）]', '', t)

    # 3. 序号自然化与停顿韵律
    t = re.sub(r'(?:^|\n)\s*(\d+)\.\s*', r'。其\1，', t)
    t = re.sub(r'(?:^|\n)\s*[-]\s*', '。又，', t)
    t = t.replace('——', '……').replace('；', '，')
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'^[。，,、：:]+', '', t).strip()

    # 4. 在合理自然句末截断（460 字上限，杜绝在 71 字处生硬腰斩）
    max_len = 460
    if len(t) > max_len:
        cut_pos = max(t.rfind("。", 180, max_len), t.rfind("！", 180, max_len), t.rfind("？", 180, max_len))
        if cut_pos != -1:
            t = t[:cut_pos + 1]
        else:
            t = t[:max_len] + "。"
    return t


_TTS_CACHE_MAX = 200
_tts_cache: "OrderedDict[str, bytes]" = OrderedDict()


@app.post("/api/tts", summary="朱子先生文人风骨语音配音合成")
async def generate_speech(req: TTSRequest):
    if not (req.text or "").strip():
        raise HTTPException(status_code=400, detail="配音文本不能为空")

    if not HAS_EDGE_TTS:
        raise HTTPException(status_code=501, detail="未安装 edge-tts 库，请先安装 edge-tts")

    speech_text = prepare_classical_speech_text(req.text)
    if not speech_text or not re.search(r'[\u4e00-\u9fffA-Za-z0-9]', speech_text):
        raise HTTPException(status_code=400, detail="过滤格式符号后无可供朗读的有效文字")

    profile = VOICE_PROFILES.get(req.style or "yunjian", VOICE_PROFILES["yunjian"])
    voice_name = profile["name"]
    rate = profile["rate"]
    pitch = profile["pitch"]

    cache_key = hashlib.md5(f"{voice_name}|{rate}|{pitch}|{speech_text}".encode("utf-8")).hexdigest()
    if cache_key in _tts_cache:
        _tts_cache.move_to_end(cache_key)
        audio_bytes = _tts_cache[cache_key]
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600"}
        )

    async def _synthesize() -> bytes:
        communicate = edge_tts.Communicate(speech_text, voice_name, rate=rate, pitch=pitch)
        chunks = []
        async for chunk in communicate.stream():
            if chunk.get("type") == "audio" and chunk.get("data"):
                chunks.append(chunk["data"])
        return b"".join(chunks)

    try:
        full_audio = await asyncio.wait_for(_synthesize(), timeout=18.0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="语音合成服务响应超时，请稍后再试")
    except Exception as e:
        print(f"[TTS] edge-tts 合成异常: {e}")
        raise HTTPException(status_code=503, detail="语音合成服务暂时不可用，请稍后重试")

    if not full_audio:
        raise HTTPException(status_code=503, detail="语音合成返回空音频，请稍后重试")

    _tts_cache[cache_key] = full_audio
    while len(_tts_cache) > _TTS_CACHE_MAX:
        _tts_cache.popitem(last=False)

    return Response(
        content=full_audio,
        media_type="audio/mpeg",
        headers={"Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600"}
    )


# ==========================================
# 考亭研撰 · 朱子文化论文写作全流程接口
# ==========================================

class ThesisTopicsRequest(BaseModel):
    keyword: Optional[str] = ""
    thesis_type: Optional[str] = "本科毕业论文"
    discipline: Optional[str] = "朱子理学与哲学"


class ThesisCitationSearchRequest(BaseModel):
    topic: Optional[str] = ""
    query: Optional[str] = ""
    top_k: Optional[int] = 6


class ThesisOutlineRequest(BaseModel):
    topic: str
    thesis_type: Optional[str] = "本科毕业论文"
    discipline: Optional[str] = "朱子理学与哲学"
    target_words: Optional[int] = 6000
    citations: Optional[List[Dict[str, Any]]] = None


class ThesisAssistRequest(BaseModel):
    action: str = "draft"
    topic: str
    chapter_title: str = "当前章节"
    chapter_summary: Optional[str] = ""
    sections: Optional[List[str]] = None
    current_draft: Optional[str] = ""
    citations: Optional[List[Dict[str, Any]]] = None
    custom_instruction: Optional[str] = ""
    target_words: Optional[int] = 1200
    session_id: Optional[str] = "thesis_default"


class ThesisReviewRequest(BaseModel):
    project: Dict[str, Any]


class ThesisDefenseRequest(BaseModel):
    action: str = "questions"
    project: Dict[str, Any]
    question: Optional[str] = ""
    answer: Optional[str] = ""


class ThesisExportRequest(BaseModel):
    project: Dict[str, Any]
    format: Optional[str] = "docx"      # docx | md
    template: Optional[str] = "full"    # full | proposal


@app.post("/api/thesis/topics", summary="朱子文化论文智能拟题")
async def api_thesis_topics(req: ThesisTopicsRequest):
    return await asyncio.to_thread(
        thesis_service.suggest_topics,
        req.keyword or "",
        req.thesis_type or "本科毕业论文",
        req.discipline or "朱子理学与哲学",
    )


@app.post("/api/thesis/citations/search", summary="动态检索武夷特藏引文并按 GB/T 7714 格式化")
async def api_thesis_citations_search(req: ThesisCitationSearchRequest):
    top_k = max(1, min(12, int(req.top_k or 6)))
    items = await asyncio.to_thread(
        thesis_service.search_library_citations,
        req.topic or "",
        req.query or "",
        top_k,
    )
    return {"total": len(items), "citations": items}


@app.post("/api/thesis/outline/generate", summary="生成可编辑三级朱子文化论文大纲")
async def api_thesis_outline_generate(req: ThesisOutlineRequest):
    try:
        return await asyncio.to_thread(
            thesis_service.generate_outline,
            req.topic,
            req.thesis_type or "本科毕业论文",
            req.discipline or "朱子理学与哲学",
            int(req.target_words or 6000),
            req.citations,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@app.post("/api/thesis/assist/stream", summary="分章正文流式起草、润色、考据增补与逻辑诊断")
async def api_thesis_assist_stream(req: ThesisAssistRequest):
    gen = thesis_service.assist_chapter_stream(
        action=req.action or "draft",
        topic=req.topic,
        chapter_title=req.chapter_title or "当前章节",
        chapter_summary=req.chapter_summary or "",
        sections=req.sections,
        current_draft=req.current_draft or "",
        citations=req.citations,
        custom_instruction=req.custom_instruction or "",
        target_words=int(req.target_words or 1200),
        session_id=req.session_id or "thesis_default",
    )
    return StreamingResponse(gen, media_type="text/event-stream", headers=SSE_HEADERS)


@app.post("/api/thesis/review", summary="五维朱子文化论文学术体检与评分")
async def api_thesis_review(req: ThesisReviewRequest):
    return await asyncio.to_thread(thesis_service.review_thesis, req.project or {})


@app.post("/api/thesis/defense", summary="互动式模拟答辩：命制质询题或评阅答辩陈词")
async def api_thesis_defense(req: ThesisDefenseRequest):
    try:
        return await asyncio.to_thread(
            thesis_service.defense_simulation,
            req.action or "questions",
            req.project or {},
            req.question or "",
            req.answer or "",
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@app.post("/api/thesis/import-draft", summary="导入已有 Word/TXT/MD/PDF 论文草稿至编辑器")
async def api_thesis_import_draft(file: UploadFile = File(...)):
    raw_name = os.path.basename((file.filename or "draft.txt").strip())
    ext = os.path.splitext(raw_name)[1].lower()
    if ext not in (".txt", ".md", ".docx", ".pdf"):
        raise HTTPException(status_code=400, detail="仅支持导入 .docx、.txt、.md、.pdf 格式草稿")
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="草稿文件超过 10 MB 上限")

    text = await asyncio.to_thread(extract_document_text, raw_name, file_bytes)
    text = thesis_service.strip_emojis(text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="未能从该文档提取出有效文字（若为扫描版 PDF，请转为可复制文本或 Word 文档后导入）")

    return {
        "filename": raw_name,
        "char_count": len(re.sub(r'\s+', '', text)),
        "text": text[:24000],
    }


@app.post("/api/thesis/export", summary="一键导出 Word (.docx 完整论文版/开题报告书版) 或 Markdown (.md)")
async def api_thesis_export(req: ThesisExportRequest):
    project = req.project or {}
    fmt = (req.format or "docx").strip().lower()
    template = (req.template or "full").strip().lower()
    if fmt not in ("docx", "md"):
        raise HTTPException(status_code=400, detail="导出格式仅支持 docx 或 md")
    if template not in ("full", "proposal"):
        template = "full"

    raw_title = thesis_service.strip_emojis(project.get("title") or "朱子文化论文").strip()
    safe_title = re.sub(r'[\\/:*?"<>|\r\n]+', '_', raw_title)[:48] or "朱子文化论文"
    suffix = "开题报告书" if template == "proposal" else "完整论文"
    filename = f"{safe_title}_{suffix}.{fmt}"
    cd_header = f"attachment; filename=\"thesis_{template}.{fmt}\"; filename*=UTF-8''{quote(filename)}"

    if fmt == "md":
        md_text = await asyncio.to_thread(thesis_service.build_markdown_export, project, template)
        return Response(
            content=md_text.encode("utf-8"),
            media_type="text/markdown; charset=utf-8",
            headers={"Content-Disposition": cd_header},
        )

    try:
        docx_bytes = await asyncio.to_thread(thesis_service.build_docx_export, project, template)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": cd_header},
    )


# ==========================================
# 健康检查与前端单页托管
# ==========================================

@app.get("/health", summary="健康检查")
@app.get("/api/health", summary="健康检查接口")
async def health_check():
    return {"status": "ok", "app": "考亭理学书院·朱子文化特色智能体", "has_tts": HAS_EDGE_TTS}


@app.get("/", summary="书院 Web 终端页面")
async def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(
            index_file,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {"message": "静态页面正在部署中..."}


# 挂载静态文件
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

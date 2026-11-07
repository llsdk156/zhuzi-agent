



"""
朱子文化特色智能体服务主程序 (FastAPI Main Application)
"""

import os
import sys
import shutil
import json
import random
import time
import re
import urllib.request
import hashlib

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse, Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from rag.rag_service import rag_service
from core.agent_engine import zhuzi_agent
from api.supernova_adapter import router as supernova_router

app = FastAPI(
    title="云起武夷·活水传理--朱熹文化",
    description="基于宋代理学大师朱熹原典文献与治学工夫构建，纯第一人称古今结合传道解惑",
    version="1.0.0"
)

# 允许跨域请求（方便学习通微应用、iframe及前端调试）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册超新星/超星及 OpenAI 兼容路由
app.include_router(supernova_router)

# 静态资源目录
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)


# ==========================================
# 核心对话与检索接口
# ==========================================

class ChatQueryRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = None
    session_id: Optional[str] = "default"
    stream: Optional[bool] = False


@app.post("/api/chat", summary="书院问对同步接口")
async def api_chat(req: ChatQueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="提问内容不可为空")
    print(f"\n>>> [学者来访·同步] 会话:{req.session_id} | 提问:{req.query}")
    res = zhuzi_agent.chat(req.query, history=req.history, session_id=req.session_id or "default")
    print(f"<<< [朱子答复] 引擎:{res.get('provider')} | 内容:{res.get('reply')[:60]}...")
    return res


@app.get("/api/chat/stream", summary="书院问对 SSE 流式接口 (GET)")
async def api_chat_stream_get(
    q: str = Query(..., description="学者提问"),
    session_id: str = Query("default", description="会话标识")
):
    if not q.strip():
        raise HTTPException(status_code=400, detail="提问内容不可为空")
    print(f"\n>>> [学者来访·流式GET] 会话:{session_id} | 提问:{q}")
    return StreamingResponse(
        zhuzi_agent.chat_stream(q, session_id=session_id),
        media_type="text/event-stream"
    )


@app.post("/api/chat/stream", summary="书院问对 SSE 流式接口 (POST)")
async def api_chat_stream_post(req: ChatQueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="提问内容不可为空")
    print(f"\n>>> [学者来访·流式POST] 会话:{req.session_id} | 提问:{req.query}")
    return StreamingResponse(
        zhuzi_agent.chat_stream(req.query, history=req.history, session_id=req.session_id or "default"),
        media_type="text/event-stream"
    )


class ChatStopRequest(BaseModel):
    session_id: str


@app.post("/api/chat/stop", summary="停止指定会话流式生成")
async def api_chat_stop(req: ChatStopRequest):
    if not req.session_id.strip():
        raise HTTPException(status_code=400, detail="session_id 不可为空")
    print(f"\n>>> [学者令止·停止输出] 会话:{req.session_id}")
    zhuzi_agent.stop_session(req.session_id)
    return {
        "code": 200,
        "message": "已成功下发停止生成指令",
        "session_id": req.session_id
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
    s = source.lower()
    if "大学" in s:
        return "daxue"
    elif "中庸" in s:
        return "zhongyong"
    elif "论语" in s:
        return "lunyu"
    elif "孟子" in s:
        return "mengzi"
    elif "近思录" in s:
        return "jinsi"
    elif "语类" in s or "语录" in s:
        return "yulei"
    elif "文集" in s or "晦庵" in s:
        return "huian"
    elif "棹歌" in s:
        return "zhaoge"
    elif "白鹿" in s or "学规" in s:
        return "bailudong"
    elif "童蒙" in s:
        return "tongmeng"
    elif "家训" in s or "格言" in s:
        return "jiaxun"
    elif "诗经" in s or "诗集传" in s:
        return "shijizhuan"
    elif "周易" in s or "易本义" in s:
        return "zhouyi"
    elif "通鉴" in s or "纲目" in s:
        return "tongjian"
    elif "楚辞" in s:
        return "chuci"
    elif "朝圣" in s or "五夫" in s:
        return "wuyi_chaosheng"
    elif "诗和远方" in s or "诗词" in s:
        return "wuyi_shici"
    elif "考亭论坛" in s or "第二届考亭" in s:
        return "wuyi_kaoting"
    elif "海外" in s:
        return "wuyi_haiwai"
    elif "世纪" in s or "协同创新" in s or "考亭理学文化" in s:
        return "wuyi_century"
    elif "政和" in s:
        return "wuyi_zhenghe"
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
        c = chap_match.group(1).strip()
        c = re.sub(r'[*_`#]', '', c).strip()
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
    kw = q.strip()
    if not kw:
        return {"query": q, "total": 0, "results": []}

    results = []
    seen_contents = set()

    # 1. 优先原典字句精准包含匹配
    for chunk in rag_service.chunks:
        if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', chunk.source):
            continue

        if kw in chunk.content:
            pos = chunk.content.find(kw)
            start = max(0, pos - 45)
            end = min(len(chunk.content), pos + len(kw) + 130)
            snip = chunk.content[start:end].replace("\n", " ").strip()
            if snip in seen_contents:
                continue
            seen_contents.add(snip)

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

    # 2. 若精确包含不足，结合 BM25 补充检索
    if len(results) < limit:
        bm25_matches = rag_service.search(kw, top_k=limit)
        for m in bm25_matches:
            src = m.get("source", "")
            if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', src):
                continue
            content = m.get("content", "")
            if not content:
                continue
            snip = content[:180].replace("\n", " ").strip()
            if snip in seen_contents:
                continue
            seen_contents.add(snip)

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
    """
    接收用户后续提供的特色文献（.txt, .md），自动写入并完成即时重索引
    """
    allowed_extensions = (".txt", ".md")
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"目前支持格式为：{', '.join(allowed_extensions)}。请上传纯文本或Markdown文献。"
        )

    content_bytes = await file.read()
    try:
        text_content = content_bytes.decode('utf-8')
    except UnicodeDecodeError:
        try:
            text_content = content_bytes.decode('gbk')
        except Exception:
            raise HTTPException(status_code=400, detail="文件编码无法识别，请确保为 UTF-8 或 GBK 编码文本。")

    # 保存并实时更新 RAG 知识库
    total_chunks = rag_service.add_custom_document(file.filename, text_content)

    return {
        "code": 200,
        "message": f"特色文献《{file.filename}》上传并索引成功！",
        "filename": file.filename,
        "char_count": len(text_content),
        "total_chunks_now": total_chunks
    }


@app.post("/api/document/analyze", summary="文献与图片深度识读剖析接口")
async def analyze_document_or_image(file: UploadFile = File(...)):
    """接收用户上传的文本、文档或图片，自动调用智谱 GLM 免费大模型进行深度义理手批或图像识读"""
    fn = file.filename.lower()
    content_bytes = await file.read()

    # 1. 图片格式识别：PNG, JPG, JPEG, WEBP, BMP
    image_exts = (".png", ".jpg", ".jpeg", ".webp", ".bmp")
    if fn.endswith(image_exts):
        ext = fn.rsplit(".", 1)[-1]
        mime_type = "image/png" if ext == "png" else "image/webp" if ext == "webp" else "image/jpeg"
        analysis = zhuzi_agent.analyze_image_with_glm(content_bytes, mime_type=mime_type)
        return {
            "code": 200,
            "filename": file.filename,
            "type": "image",
            "prompt": f"弟子呈上古籍图画墨宝《{file.filename}》，请先生朱砂手批考释：\n\n{analysis}",
            "analysis": analysis
        }

    # 2. 文本与文档格式提取：TXT, MD, DOCX, PDF
    text_content = ""
    if fn.endswith((".txt", ".md")):
        try:
            text_content = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text_content = content_bytes.decode("gbk")
            except Exception:
                text_content = content_bytes.decode("utf-8", errors="ignore")
    elif fn.endswith(".docx"):
        import io
        import zipfile
        import xml.etree.ElementTree as ET
        try:
            with zipfile.ZipFile(io.BytesIO(content_bytes)) as zf:
                xml_content = zf.read("word/document.xml")
                root = ET.fromstring(xml_content)
                texts = [elem.text for elem in root.iter() if elem.text]
                text_content = "\n".join(texts)
        except Exception as e:
            text_content = f"文档解析提示：{e}"
    elif fn.endswith(".pdf"):
        raw_str = content_bytes.decode("latin-1", errors="ignore")
        pdf_texts = re.findall(r"Tj\s*([^\n\r]+)", raw_str)
        if pdf_texts:
            text_content = "\n".join(pdf_texts)
        else:
            text_content = content_bytes.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(
            status_code=400,
            detail="目前支持格式：TXT、MD、DOCX、PDF 文档以及 PNG、JPG、WEBP 图像"
        )

    if not text_content.strip():
        text_content = f"文献《{file.filename}》内容为空或暂无法提取文本。"

    analysis = zhuzi_agent.analyze_document_with_glm(file.filename, text_content)
    return {
        "code": 200,
        "filename": file.filename,
        "type": "document",
        "prompt": f"弟子呈上文献《{file.filename}》，请先生朱砂手批指点：\n\n{analysis}",
        "analysis": analysis
    }


@app.get("/api/model/status", summary="当前大模型驱动状态")
async def get_model_status():
    """返回当前大模型驱动引擎与可用状态"""
    has_key = bool(zhuzi_agent.api_key)
    return {
        "provider": "智谱清言 GLM 官方免费模型",
        "has_api_key": has_key,
        "text_model": zhuzi_agent.llm_model,
        "vision_model": zhuzi_agent.vision_model,
        "api_base_url": zhuzi_agent.api_base_url,
        "is_cloud_free": True
    }


@app.post("/api/knowledge/reload", summary="全量重载并更新朱子典籍知识库")
async def reload_knowledge_base():
    """
    触发 RAG 混合知识库重新扫描所有目录（base_corpus, ebooks_download, custom_corpus）并刷新索引
    """
    rag_service.load_all_corpora()
    stats = rag_service.get_stats()
    return {
        "code": 200,
        "message": f"知识库已成功全量更新！收录段落分块: {stats['total_chunks']}，经典电子书: {stats['ebooks_download_count']}本，特色文献: {stats['base_corpus_count']}篇。",
        "stats": stats
    }


# ==========================================
# 典籍与特色文献具体正文全文阅读接口
# ==========================================

def resolve_book_path(book_key: Optional[str], filename: Optional[str] = None, title: Optional[str] = None) -> Optional[str]:
    base_dir = os.path.join(os.path.dirname(__file__), "data", "base_corpus")
    ebooks_dir = os.path.join(os.path.dirname(__file__), "data", "ebooks_download")
    arch_dir = os.path.join(os.path.dirname(__file__), "data", "archive_legacy_base_corpus")

    # 1. 优先按具体文件名寻找（先扫描下载的全本电子书，后基础语料，后归档语料）
    if filename:
        clean_fn = filename.strip().replace("《", "").replace("》", "")
        for d in [ebooks_dir, base_dir, arch_dir]:
            if os.path.exists(d):
                p = os.path.join(d, clean_fn)
                if os.path.exists(p):
                    return p
                if not clean_fn.endswith(".txt"):
                    p_txt = os.path.join(d, clean_fn + ".txt")
                    if os.path.exists(p_txt):
                        return p_txt
                for cand in os.listdir(d):
                    if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', cand):
                        continue
                    if clean_fn in cand or cand.replace(".txt", "") in clean_fn:
                        return os.path.join(d, cand)

    # 1.1 若带有题名，尝试按题名匹配
    if title:
        clean_t = title.strip().replace("《", "").replace("》", "").replace("考亭理学", "朱子学")
        for d in [ebooks_dir, base_dir, arch_dir]:
            if os.path.exists(d):
                for cand in os.listdir(d):
                    if re.search(r'[\u0400-\u04ff\u2500-\u257f\ufffd]', cand):
                        continue
                    if clean_t in cand or any(part in cand for part in clean_t.split("_") if len(part) >= 3):
                        return os.path.join(d, cand)

    if not book_key:
        book_key = "daxue"

    bk = book_key.lower().strip()

    # 2. 全库权威典籍与特色专著全量映射表（杜绝任何错位与中庸默认顶替）
    exact_map = {
        # 四书经典
        "sishu": os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt"),
        "daxue": os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt"),
        "zhongyong": os.path.join(ebooks_dir, "四书章句集注_中庸章句_完整全本.txt"),
        "lunyu": os.path.join(arch_dir, "01_四书章句集注_大学中庸精粹.txt"),
        "mengzi": os.path.join(arch_dir, "01_四书章句集注_大学中庸精粹.txt"),
        # 理学道统
        "jinsi": os.path.join(ebooks_dir, "近思录_全十四卷_朱熹吕祖谦编_完整全本.txt"),
        "daoti": os.path.join(ebooks_dir, "近思录_全十四卷_朱熹吕祖谦编_完整全本.txt"),
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
        # 家训蒙学与书院学规
        "tongmeng": os.path.join(ebooks_dir, "童蒙须知_朱子儿童修养与进退规矩_完整全本.txt"),
        "jiaxun": os.path.join(ebooks_dir, "朱子治家格言与家训_完整全本.txt"),
        "bailu": os.path.join(ebooks_dir, "白鹿洞书院学规_完整全本.txt"),
        "bailudong": os.path.join(ebooks_dir, "白鹿洞书院学规_完整全本.txt"),
        "xuegui": os.path.join(ebooks_dir, "白鹿洞书院学规_完整全本.txt"),
        "zhaoge": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "wuyi_poems": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "wuyi_records": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "huian": os.path.join(ebooks_dir, "晦庵先生朱文公文集_考亭书院规约与名篇全集.txt"),
        "wenji": os.path.join(ebooks_dir, "晦庵先生朱文公文集_考亭书院规约与名篇全集.txt"),
        "chuci": os.path.join(ebooks_dir, "晦庵先生朱文公文集_考亭书院规约与名篇全集.txt"),
        # 武夷学院特色文献专著库（与 library_3d.js 和 base_corpus 严格一一对应）
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
        "wuyi_fujian": os.path.join(base_dir, "01_世纪之交的朱子学_朱子文化协同创新文丛.txt"),
        "wuyi_zhenghe": os.path.join(base_dir, "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt"),
        "06_zhenghe": os.path.join(base_dir, "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt"),
    }

    if bk in exact_map and os.path.exists(exact_map[bk]):
        return exact_map[bk]

    # 3. 语义模糊匹配：按关键字在目录文件中检索
    for d in [ebooks_dir, base_dir, arch_dir]:
        if os.path.exists(d):
            for cand in os.listdir(d):
                cand_lower = cand.lower()
                if bk in cand_lower or any(part in cand_lower for part in bk.split("_") if len(part) >= 2):
                    return os.path.join(d, cand)

    # 4. 兜底大学章句（仅当无法识别时，绝不随意错配）
    default_p = os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt")
    if os.path.exists(default_p):
        return default_p
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

    lines = raw_content.split("\n")
    title_res = os.path.basename(abs_path).replace(".txt", "").replace(".md", "")
    chapters = []
    curr_chapter = {"title": "卷首与引言", "lines": []}
    chap_re = re.compile(r'^(#{1,4})\s+(.+)$')

    for line in lines:
        m = chap_re.match(line.strip())
        if m:
            level = len(m.group(1))
            ch_title = m.group(2).strip()
            if level == 1 and not chapters and not curr_chapter["lines"]:
                title_res = ch_title
                continue
            if curr_chapter["lines"]:
                curr_chapter["content"] = "\n".join(curr_chapter["lines"]).strip()
                chapters.append(curr_chapter)
            curr_chapter = {"title": ch_title, "lines": []}
        else:
            curr_chapter["lines"].append(line)

    if curr_chapter["lines"]:
        curr_chapter["content"] = "\n".join(curr_chapter["lines"]).strip()
        chapters.append(curr_chapter)

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
    """返回全库可供学者翻阅研读的完整文献书目"""
    stats = rag_service.get_stats()
    return {
        "base_corpus": stats["base_files"],
        "ebooks": stats["ebooks_files"],
        "total_books": len(stats["base_files"]) + len(stats["ebooks_files"]),
        "total_chunks": stats["total_chunks"]
    }


# ==========================================
# 考亭考校堂试题与研学评卷接口
# ==========================================

QUIZ_BANK_PATH = os.path.join(os.path.dirname(__file__), "data", "quiz_bank.json")
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
    cat = category.strip() if category else "all"
    if cat and cat != "all":
        filtered = [
            q for q in bank
            if q.get("category") == cat or q.get("category_id") == cat or cat in q.get("category", "")
        ]
        if not filtered:
            filtered = bank

    lim = limit if limit and limit > 0 else 5
    if random_sample and len(filtered) > lim:
        chosen = random.sample(filtered, lim)
    else:
        chosen = filtered[:lim]

    client_questions = []
    for q in chosen:
        client_questions.append({
            "id": q.get("id"),
            "category_id": q.get("category_id"),
            "category": q.get("category"),
            "question": q.get("question"),
            "options": q.get("options", []),
            "book_title": q.get("book_title", "")
        })

    return {
        "questions": client_questions,
        "total": len(client_questions),
        "category": cat
    }


class QuizSubmitRequest(BaseModel):
    answers: Dict[str, Any]  # q_id -> choice_index


@app.post("/api/quiz/submit", summary="呈交考校答卷并获取考亭先生朱批")
async def submit_quiz(req: QuizSubmitRequest):
    bank = load_quiz_bank()
    bank_map = {q.get("id"): q for q in bank}

    answers = req.answers or {}
    total = len(answers) if answers else 5
    if total == 0:
        total = 5

    correct_count = 0
    details = []

    for q_id, user_choice in answers.items():
        q_item = bank_map.get(q_id)
        if not q_item:
            continue
        try:
            choice_int = int(user_choice) if user_choice is not None else None
        except Exception:
            choice_int = None

        correct_ans = int(q_item.get("answer", 0))
        is_corr = (choice_int == correct_ans)
        if is_corr:
            correct_count += 1

        ans_idx = correct_ans
        options = q_item.get("options", [])
        correct_text = options[ans_idx] if ans_idx < len(options) else ""
        raw_analysis = q_item.get("analysis", "") or q_item.get("explanation", "")
        book_title = q_item.get("book_title", "考亭典籍")

        if raw_analysis:
            exp_text = f"【原典精义】：{raw_analysis} 此题定按‘{correct_text}’，盖因《{book_title}》字字切己体察，深明道体工夫之枢纽。学者当循序渐进，涵泳笃行。"
        else:
            exp_text = f"考亭先生当堂开示：此题定按‘{correct_text}’，引据《{book_title}》。学者研读经义，贵在字求其训、反求诸身，不可随波逐流认气为理，当主敬立诚、切己体察。"

        details.append({
            "id": q_id,
            "question": q_item.get("question"),
            "user_choice": choice_int,
            "correct_choice": correct_ans,
            "is_correct": is_corr,
            "analysis": exp_text,
            "explanation": exp_text,
            "book_title": book_title,
            "category": q_item.get("category", "")
        })

    total_submitted = len(details) if details else total
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


class LetterSubmitRequest(BaseModel):
    thought: Optional[str] = ""
    content: Optional[str] = ""


def extract_ancient_letter_reply(text: str) -> str:
    if not text:
        return ""
    # 1. 若包含 Markdown 代码块，提取内部纯文本
    code_match = re.search(r'```(?:[a-zA-Z]*\n)?(.*?)```', text, re.DOTALL)
    if code_match:
        text = code_match.group(1).strip()

    # 2. 定位开篇称谓提称语（过滤开头的任何大模型分析与前言）
    salutation_keywords = [
        '妆次', '足下', '台鉴', '函丈', '道席', '尊前', '知鉴', '览之',
        '铭', '座右', '如晤', '惠鉴', '青睐', '先生', '吾儿', '贤侄', '仁兄'
    ]
    lines = text.split('\n')
    start_idx = 0
    for i, line in enumerate(lines):
        l = line.strip()
        if (l.endswith('：') or l.endswith(':')) and any(k in l for k in salutation_keywords) and len(l) <= 20:
            start_idx = i
            break
        elif any(k in l for k in ['座右自警铭', '自警铭', '日省箴', '座右铭']):
            start_idx = i
            break
    lines = lines[start_idx:]

    # 3. 定位末尾落款结语（过滤末尾的任何说明或赏析文字）
    signoff_keywords = [
        '谨手拜', '再拜顿首', '顿首再拜', '顿首谨禀', '肃拜谨禀', '手字',
        '谨铭', '谨奉', '谨记', '谨上', '拜覆', '手书', '顿首', '谨启', '手笔', '谨拜'
    ]
    end_idx = len(lines)
    for i in range(len(lines) - 1, -1, -1):
        l = lines[i].strip()
        if any(k in l for k in signoff_keywords) and len(l) <= 20:
            end_idx = i + 1
            break
    text = '\n'.join(lines[:end_idx]).strip()

    # 4. 净化出处标记与圆括号
    text = re.sub(r'📜.*?(?=\n\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'🏛️.*?(?=\n\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'【典籍.*?】.*?(?=\n\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'【.*?OPAC.*?】.*?(?=\n\n|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'-{3,}', '', text)
    text = text.replace("老夫复论：", "")
    text = re.sub(r'[\(（][^()（）]*?[\)）]', '', text)
    text = re.sub(r'[\(（\)]', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text


@app.post("/api/letter/submit", summary="考亭尺牍代拟与墨札批复接口")
async def submit_letter(req: LetterSubmitRequest):
    user_thought = (req.thought or req.content or "").strip()
    if not user_thought:
        raise HTTPException(status_code=400, detail="寄托心意不可为空")

    reply = ""
    dynamic_date = "宋绍熙四年暮春 友生顿首再拜"
    dynamic_seal = "考亭<br>晦翁"

    # 根据问学者问题与寄意，智能判别信札体裁与印鉴落款
    thought_lower = user_thought.lower()

    if any(k in thought_lower for k in ["女孩", "女生", "女子", "姑娘", "心仪", "爱慕", "喜欢", "意中人", "慕悦", "佳人", "倾心", "表白", "恋", "红颜", "窈窕", "情书", "情意", "眷念", "思慕", "结发", "琴瑟", "暗恋", "心动", "悦慕"]):
        dynamic_seal = "同心<br>存诚"
        dynamic_date = "宋绍熙四年暮春 手书谨寄"
    elif any(k in thought_lower for k in ["同窗", "好友", "朋友", "同门", "仁兄", "同砚", "劝勉", "勉励", "立志读书", "切磋", "砥砺", "共勉"]):
        dynamic_seal = "考亭<br>晦翁"
        dynamic_date = "宋绍熙四年暮春 友生顿首再拜"
    elif any(k in thought_lower for k in ["急躁", "浮躁", "浮动", "戒急", "慎独", "主敬", "收敛", "戒躁", "脾气", "冲动", "反省", "克己", "修身", "警策", "座右铭", "自律"]):
        dynamic_seal = "主敬<br>存诚"
        dynamic_date = "宋绍熙三年春 敬书于座右以自省"
    elif any(k in thought_lower for k in ["后辈", "晚辈", "子侄", "童蒙", "幼学", "家训", "儿", "侄"]):
        dynamic_seal = "考亭<br>晦翁"
        dynamic_date = "宋庆元四年季秋 手书示家塾子侄"
    elif any(k in thought_lower for k in ["师", "先生", "夫子", "请益", "求教", "问难", "受教", "疑难", "困惑", "读书法", "四书", "格物", "穷理"]):
        dynamic_seal = "受业<br>谨呈"
        dynamic_date = "宋庆元四年暮春 受业门生肃拜谨禀"
    elif any(k in thought_lower for k in ["山", "武夷", "九曲", "游", "景", "茶", "胜景", "自然", "泉", "竹筏", "泛舟"]):
        dynamic_seal = "九曲<br>活水"
        dynamic_date = "宋绍熙二年夏 隐屏精舍客次题寄"
    elif any(k in thought_lower for k in ["累", "倦", "怠", "难", "惑", "烦", "学不进", "心杂", "迷茫", "消沉", "挫折"]):
        dynamic_seal = "明道<br>安身"
        dynamic_date = "宋淳熙八年长至日 示知己自安手简"
    elif any(k in thought_lower for k in ["家", "乡", "亲", "父母", "慈母", "严父", "故乡"]):
        dynamic_seal = "思亲<br>修身"
        dynamic_date = "宋绍熙五年春 客次谨奉家慈"
    else:
        dynamic_seal = "考亭<br>晦翁"
        dynamic_date = "宋绍熙四年暮春 友生顿首再拜"

    # 1. 调用智谱清言 GLM 免费大模型，因题制宜智能生成高古宋风文人尺牍
    if zhuzi_agent.api_key:
        try:
            system_prompt = (
                "你是一位精通宋代理学文献与宋代文人尺牍传统的手札宗师。\n"
                "请深度研判问学者提出的真实意图、写信对象与具体诉求，结合宋代朱熹理学精神，智能代拟一封意境高古、格式完全因题制宜的宋代文人手札尺牍。\n"
                "【绝对核心铁律·彻底打破单一死板与统一模板】：\n"
                "1. 严禁统一格式！必须根据学者需求判断信札的真实受众与体裁：\n"
                "   - 若是【慕悦佳人/倾心表白/男女相悦情书尺牍】（如学者言及喜欢女孩、心仪姑娘、爱慕表白）：体裁为雅正深情之宋代文人情简尺牍，称谓如‘卿卿妆次：’、‘仁姐台鉴：’或‘妆次：’，借《诗经·周南·关雎》（“窈窕淑女，君子好逑”）、《蒹葭》（“所谓伊人，在水一方”）及朱子《诗集传》（男女相悦，性情之真，发乎情止乎礼义）男女正情入笔，写尽相思爱慕与结发同心之愿，辞藻典雅清绝、温婉真挚，结语落款如‘友生 谨手拜’或‘某 顿首谨手拜’；\n"
                "   - 若是【写给朋友/同窗劝勉】：体裁为朋侪书简，称谓为‘仁兄足下：’、‘同砚知交台鉴：’，正文劝勉立志与精进，结语落款‘同门生 再拜顿首’、‘友弟 顿首’；\n"
                "   - 若是【自省自励、戒急戒躁、慎独修身】：体裁为《座右自警铭》或《日省箴》，首行为‘座右自警铭：’或‘某敬书自勉座右：’，四六骈散交织，结语‘后学 谨铭’；\n"
                "   - 若是【向师长/朱熹请益读书治学】：体裁为经义问难帖，称谓为‘考亭夫子函丈：’、‘先生道席：’，结语‘受业门生 肃拜谨禀’；\n"
                "   - 若是【勉励晚辈/子弟家塾修德】：体裁为家书示帖，称谓为‘贤侄足下：’、‘吾儿览之：’，结语‘老夫 手字’；\n"
                "   - 若是【山水寄怀/烹茶赏景】：体裁为山水清赏简，称谓为‘同道知交：’，结语‘武夷客次 友生顿首’；\n"
                "   - 若是【困顿疲惫/劝慰宽怀】：体裁为温和慰勉手札，称谓‘仁兄知鉴：’，结语‘朋弟 谨奉’；\n"
                "   - 若是【思乡念亲】：体裁为客次寄家书，称谓‘堂上双亲大人膝下：’，结语‘男 顿首谨上’。\n"
                "2. 绝不可所有信都写成同一种受众或‘考亭先生函丈’！\n"
                "3. 将朱子理学功夫（如主敬涵养、循序渐进、格物穷理、心平气和、事上磨炼）浑融于字里行间，绝无半句现代机械套话。\n"
                "4. 严格段落分明与空行排版规范（完美复刻宋代文人尺牍名帖布局）：\n"
                "   - 首行独占一行：称谓提称语（如‘卿卿妆次：’或‘仁兄足下：’）；\n"
                "   - 正文分为2至3个自然段，每段之间必须留一个空行（即用\\n\\n分隔），由事入理，从容跌宕；\n"
                "   - 末尾独占一行：结语敬辞落款（如‘友生 谨手拜’或‘同门生 再拜顿首’）；\n"
                "5. 严禁出现任何【典籍出处】、【索书号】或参考文献注解！\n"
                "6. 【红线铁律】：绝对严禁输出任何中英文半角或全角圆括号！\n"
                "7. 【纯粹手札禁令】：绝对严禁输出任何前言、受众分析、破题解释、后记赏析或说明性文字！绝对严禁包裹 Markdown 代码块（如```）！必须直接从首行称谓起笔，至末尾落款结束！"
            )
            is_girl_letter = any(k in thought_lower for k in ["女孩", "女生", "女子", "姑娘", "心仪", "爱慕", "喜欢", "意中人", "慕悦", "佳人", "倾心", "表白", "恋", "红颜", "窈窕", "情书", "情意", "眷念", "思慕", "结发", "琴瑟", "暗恋", "心动", "悦慕"])
            if is_girl_letter:
                user_msg = (
                    f"问学者托付的心意为：【{user_thought}】。\n"
                    "写信受众为心仪之女子。请以男子向女子修书倾诉真挚爱慕的口吻代拟，称谓为‘卿卿妆次：’，自称‘仆’或‘生’，称对方为‘卿’（绝不可称对方为‘君’），借《诗经·周南》窈窕淑女琴瑟静好之义，表达慕悦与白首之期。直接输出尺牍正文。"
                )
            else:
                user_msg = f"问学者提出的心意、困惑或欲托付书札之寄语为：\n{user_thought}\n\n请首先研判其写信对象与意向，因题制宜智能代拟一封格局灵动、文辞雅正、段落分明的纯宋风尺牍。直接输出正文，绝无任何解释说明。"

            messages = [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_msg
                }
            ]
            endpoint = f"{zhuzi_agent.api_base_url.rstrip('/')}/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {zhuzi_agent.api_key}"
            }
            payload = {
                "model": zhuzi_agent.llm_model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 800
            }
            req_glm = urllib.request.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers
            )
            with urllib.request.urlopen(req_glm, timeout=25) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                raw_reply = resp_data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                reply = extract_ancient_letter_reply(raw_reply)
                if is_girl_letter and reply:
                    reply = reply.replace("老夫先生", "考亭先生").replace("老夫云", "考亭先生尝云")
                    reply = reply.replace("待君佳音", "伏盼芳音").replace("望君", "望卿").replace("想君", "想卿").replace("与君", "与卿").replace("愿君", "愿卿")
        except Exception as e:
            print(f"[Letter] 智谱大模型代拟遇阻，启用因题制宜内生高古书信引擎: {e}")

    # 2. 内生因题制宜高雅书信保障（多体裁深度融合，绝无机械引号与单一死板模板）
    if not reply or len(reply) < 30:
        if any(k in thought_lower for k in ["女孩", "女生", "女子", "姑娘", "心仪", "爱慕", "喜欢", "意中人", "慕悦", "佳人", "倾心", "表白", "恋", "红颜", "窈窕", "情书", "情意", "眷念", "思慕", "结发", "琴瑟", "暗恋", "心动", "悦慕"]):
            reply = (
                "卿卿妆次：\n\n"
                "自昔日得睹芳仪，清雅温润，动静合度，虽经月余，寤寐难忘。考亭先生注《周南》尝云：“男女相悦，性情之真，窈窕淑女，君子好逑。”仆虽潜心书史，志在正心诚意，然见端庄贞静如卿，心实慕之。\n\n"
                "所谓伊人，在水一方。天地虽广，入怀者独卿一人耳。愿修尺素，托武夷活水而遥递深衷。愿得执子之手，与子偕老，同心存诚，琴瑟静好。荒简披沥，伏惟芳照。\n\n"
                "友生 谨手拜"
            )
        elif any(k in thought_lower for k in ["同窗", "好友", "朋友", "同门", "仁兄", "同砚", "劝勉", "勉励", "立志读书", "切磋", "砥砺", "共勉"]):
            reply = (
                "仁兄足下：\n\n"
                "春和景明，伏惟道履清泰。比闻仁兄近来研习经义，颇生浮怠之虑，涉猎茫然，未能专精。吾辈既投身圣门，当明为学如逆水行舟，一日不进则退千里之理。\n\n"
                "考亭先生尝训门人曰：“学问之功，贵在立志高远，循序渐进。”所谓循序渐进者，先定其规矩，字字切己涵泳，万不可贪多躁进。世间虚名浮誉，倏忽如过眼烟云；惟性理笃实之功，方能润身安命。\n\n"
                "愿与仁兄重整策励，共守主敬存诚之规，晨起省察，夜静默涵。切莫因一时困顿而画地自限，虚度锦绣光阴。特此布臆，伏祈自重自爱。\n\n"
                "同门生 再拜顿首"
            )
        elif any(k in thought_lower for k in ["急躁", "浮躁", "浮动", "戒急", "慎独", "主敬", "收敛", "戒躁", "脾气", "冲动", "反省", "克己", "修身", "警策", "座右铭", "自律"]):
            reply = (
                "座右自警铭：\n\n"
                "心如止水，鉴照无遗。气若浮动，私欲乘隙。\n\n"
                "念起于微，必察其欺；事接于物，必循其理。主敬整躬，收摄放心。宽着期限，紧着工夫。凡遇躁急，必自反求诸己：何事滞于得失？何念扰于胸次？湛然澄定，客气自销。\n\n"
                "朝夕省察，不敢稍怠。铭此座右，永矢弗谖。\n\n"
                "后学 谨铭"
            )
        elif any(k in thought_lower for k in ["后辈", "晚辈", "子侄", "童蒙", "幼学", "家训", "儿", "侄"]):
            reply = (
                "贤侄足下：\n\n"
                "得汝手书，知汝初入郡庠，志在进业，甚慰老怀。\n\n"
                "为学之道，莫先于立品。《童蒙须知》所列衣服冠履、语言步趋，皆修身下手根本。切不可慕虚华文辞而轻视日用践履。每日读经须字字吃紧，精思熟读。更当亲近笃实醇谨之士，切戒浮夸骄矜。专精纯粹，日新又新，方不负宗族之望。\n\n"
                "老夫 手字"
            )
        elif any(k in thought_lower for k in ["师", "先生", "夫子", "请益", "求教", "问难", "读书法", "四书", "格物", "穷理"]):
            reply = (
                "考亭夫子函丈：\n\n"
                "受业门生肃拜谨禀。近读《大学章句》格物致知之训，于‘众物之表里精粗无不到、吾心之全体大用无不明’一节，心下颇有疑滞。\n\n"
                "敢问夫子：学者于日用伦常细微处穷格一物，何以能通达万物之全理？是须逐一穷尽，抑或积习贯通？门生学殖未充，思之难明，伏乞夫子特赐垂训剖示，以开后学之蔽。\n\n"
                "受业门生 顿首肃禀"
            )
        elif any(k in thought_lower for k in ["山", "武夷", "九曲", "游", "景", "茶", "胜景", "自然", "泉", "竹筏"]):
            reply = (
                "武夷山水寄怀简：\n\n"
                "久仰武夷云水之胜，今岁行游九曲溪山，俯仰群峰耸翠，清流潆洄，顿觉天地浩荡，万物条畅。忆及晦翁先生当年隐屏结庐、棹歌赋诗，即山水以穷天地之理，心神为之澄澈。\n\n"
                "夫山静而水流，一动一静，无非至理运行。人居其间，若能扫荡胸次尘嚣，以主敬之心涵泳其中，则清泉翠竹皆助涵养。后学虽客居行旅，亦当以先生‘活水清源’之训自砥，使日用起居常如九曲澄潭，不染纤尘。\n\n"
                "武夷客次 友生顿首"
            )
        elif any(k in thought_lower for k in ["累", "倦", "怠", "难", "惑", "烦", "学不进", "心杂", "迷茫", "消沉"]):
            reply = (
                "仁兄知鉴：\n\n"
                "知兄近日操劳身心，困于外境，涉猎经传未获快然，不免意兴阑珊。圣贤之道，原非勉强苦索，正当于忧患困顿处体认天理。\n\n"
                "夫子尝言：“涵养未发，心体澄然。为学正如磨镜，垢尽明自现。” 且请放宽心量，莫向得失上苦苦纠结。天地生生之意，无处不发。暂息营营之念，静心安顿，待神清气定，自见活水长流。愚弟谨具素笺，敬为宽解。\n\n"
                "朋弟 谨奉"
            )
        elif any(k in thought_lower for k in ["家", "乡", "亲", "父母", "慈母", "严父", "故乡"]):
            reply = (
                "堂上双亲大人膝下：\n\n"
                "客中接得家书，伏悉起居康宁，喜慰何言。游子羁寓武夷，山中云物清旷，馆课粗毕，勉循程限，不敢虚度。念及春风渐暖，庭前花木当已敷荣，晨夕遥怀，曷胜驰企。\n\n"
                "儿在此中主敬整躬，自爱自重，衣食随宜，幸勿挂怀。所期日进规矩，免招严训，伏愿双亲保重玉体，顺时节宣。草此附候，叩请金安。\n\n"
                "男 顿首谨上"
            )
        else:
            reply = (
                "考亭尺牍·寄言抒怀：\n\n"
                "顷承来示，托付胸中意气，言辞诚悫，足见贤生性情之笃。天地大化，万物化醇，人心之思接通造化，发而皆中节，自是天理流行。\n\n"
                "学者居敬存养，随处皆有涵泳安顿之所。无论处幽居显、游心山水或寄情人事，苟能守其诚、谨其独，则事事皆成学问，日用起居自然天真条畅。谨濡淡墨，略陈鄙臆，以佐清吟。\n\n"
                "友生 谨手拜"
            )

    # 3. 彻底清洗出处元数据与圆括号，确保纯粹文人手札
    reply = extract_ancient_letter_reply(reply)
    return {
        "reply": reply,
        "date": dynamic_date,
        "seal": dynamic_seal
    }


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
    from core.opac_service import opac_service
    return opac_service.get_all_books()


@app.get("/api/opac/status", summary="查询特定典籍实时在架与可借状态")
async def get_opac_status(
    keyword: Optional[str] = Query(None, description="书名、索书号或典籍ID"),
    book_title: Optional[str] = Query(None, description="书名"),
    force: bool = Query(False, description="是否强制刷新图书馆后台实时数据")
):
    from core.opac_service import opac_service
    target = keyword or book_title or "大学章句"
    return opac_service.get_live_book_status(target, force=force)


@app.post("/api/opac/batch-status", summary="批量查询典籍实时在架状态")
async def get_opac_batch_status(req: Dict[str, Any]):
    from core.opac_service import opac_service
    keywords = req.get("titles") or req.get("keywords") or req.get("books") or []
    force = req.get("force", False)
    results = {}
    for kw in keywords:
        results[kw] = opac_service.get_live_book_status(kw, force=force)
    return {"results": results, "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")}


@app.post("/api/opac/reserve", summary="提交武夷学院图书馆线下借阅预约单")
async def create_opac_reservation(req: OPACReservationRequest):
    from core.opac_service import opac_service
    payload = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    reader_name = payload.get("reader_name") or payload.get("readerName") or "考亭后学"
    card_id = payload.get("card_id") or payload.get("readerId") or ""
    pickup_date = payload.get("pickup_date") or payload.get("pickupDate") or time.strftime("%Y-%m-%d")
    pickup_location = payload.get("pickup_location") or payload.get("pickupLocation") or "逸夫图书馆六楼特藏专区服务台"
    
    payload["readerName"] = reader_name
    payload["readerId"] = card_id
    payload["pickupDate"] = pickup_date
    payload["pickupLocation"] = pickup_location
    
    record = opac_service.create_reservation(payload)
    return {
        "success": True,
        "status": "ok",
        "message": "线下预约申请提交成功！已为您锁定架位",
        "reservation_id": record.get("reservationId"),
        "valid_until": f"{pickup_date} 17:30",
        "reservation": record
    }


@app.get("/api/opac/reservations", summary="获取已提交的线下借阅预约单")
async def list_opac_reservations(card_id: Optional[str] = Query(None, description="读者学号/借书证号")):
    from core.opac_service import opac_service
    return {"reservations": opac_service.load_reservations(card_id=card_id)}


@app.get("/api/opac/accounts", summary="获取已登记读者账号列表")
async def list_opac_accounts():
    from core.opac_service import opac_service
    return {"accounts": opac_service.get_known_accounts()}


@app.post("/api/opac/cancel", summary="取消线下借阅预约单")
async def cancel_opac_reservation(req: Dict[str, Any]):
    from core.opac_service import opac_service
    res_id = (req.get("reservationId") or req.get("reservation_id") or req.get("id") or "").strip()
    if not res_id:
        raise HTTPException(status_code=400, detail="预约单号不可为空")
    result = opac_service.cancel_reservation(res_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


@app.get("/api/health", summary="健康检查接口")
async def api_health():
    return {"status": "ok", "app": "考亭理学书院·朱子文化特色智能体", "has_tts": HAS_EDGE_TTS}


# ==========================================
# 朱子语音配音合成接口 (文人风骨多音色引擎)
# ==========================================

import re
try:
    import edge_tts
    HAS_EDGE_TTS = True
except ImportError:
    HAS_EDGE_TTS = False

# 文人风骨声线配置库（全局统一唯一考亭大儒专属声线）
VOICE_PROFILES = {
    "yunjian": {
        "name": "zh-CN-YunjianNeural",
        "rate": "-8%",   # 沉稳从容，抑扬顿挫
        "pitch": "-2Hz",  # 胸腔共鸣，老生苍劲大儒风骨
        "title": "考亭大儒 · 苍劲风骨"
    }
}


class TTSRequest(BaseModel):
    text: str
    style: Optional[str] = "yunjian"  # 考亭大儒专属音色
    voice: Optional[str] = None


@app.get("/api/tts/voices", summary="获取考亭夫子专属音色")
async def list_literati_voices():
    return {
        "default": "yunjian",
        "voices": [
            {"id": "yunjian", "title": "🎙️ 考亭大儒 · 苍劲风骨（唯一专属声线 · 沉郁温厚大儒气象）", "desc": "沉郁苍劲，抑扬顿挫，深具宋代理学家风骨，告别机械AI感与繁杂声线"}
        ]
    }


def prepare_classical_speech_text(raw_text: str) -> str:
    """对文白夹杂文本进行古韵韵律重构，去除机械生硬感，增强呼吸停顿与抑扬感"""
    t = raw_text

    # 0. 彻底剔除所有中英文圆括号及其内部内容（如提示、规则、注记），严禁读出括号内容
    t = re.sub(r'[\(（][^()（）]*?[\)）]', '', t, flags=re.DOTALL)
    t = re.sub(r'[\(（].*?$', '', t)

    # 1. 净化 Markdown 格式符号与考据小标题
    t = re.sub(r'[*#>`_~\[\]\(\)]', '', t)
    t = re.sub(r'【考亭典籍考引】', '。考亭典籍有云：', t)
    t = re.sub(r'【.*?】', '，', t)

    # 2. 将阿拉伯数字标号转换为口语自然过渡，避免机械报数
    t = re.sub(r'(?:^|\n)\s*(\d+)\.\s*', r'。其\1，', t)
    t = re.sub(r'(?:^|\n)\s*[-*]\s*', '。又，', t)

    # 3. 增强文人风骨长句与破折号的音律留白
    t = t.replace('——', '……')
    t = t.replace('；', '，')
    t = t.replace('……', '…… ')

    # 4. 去除多余空行与冗余空格
    t = re.sub(r'\s+', ' ', t).strip()

    # 截取适度长度保证流畅度与出声速度
    if len(t) > 350:
        t = t[:350] + "。诸生当切己体察。"

    return t


_tts_cache: Dict[str, bytes] = {}


@app.post("/api/tts", summary="朱子先生文人风骨语音配音合成")
async def generate_speech(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="配音文本不能为空")

    if not HAS_EDGE_TTS:
        raise HTTPException(status_code=501, detail="未安装 edge-tts 库，请使用浏览器原生配音")

    # 进行文人音律与留白平滑处理
    refined_text = prepare_classical_speech_text(req.text)

    # 极速响应：提取首部完整精义句（150-200字）以实现回答完毕后立马出声
    if len(refined_text) > 180:
        idx_p = refined_text.find("。", 70)
        if idx_p != -1 and idx_p < 200:
            speech_subtext = refined_text[:idx_p + 1]
        else:
            speech_subtext = refined_text[:160] + "。"
    else:
        speech_subtext = refined_text

    cache_key = hashlib.md5(speech_subtext.encode("utf-8")).hexdigest()
    if cache_key in _tts_cache:
        return Response(content=_tts_cache[cache_key], media_type="audio/mpeg")

    # 严格统一为唯一考亭大儒专属声线 (zh-CN-YunjianNeural)，杜绝杂乱声线
    voice_name = "zh-CN-YunjianNeural"
    rate = "-8%"
    pitch = "-2Hz"

    communicate = edge_tts.Communicate(speech_subtext, voice_name, rate=rate, pitch=pitch)
    audio_chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])

    full_audio = b"".join(audio_chunks)
    if len(_tts_cache) < 300:
        _tts_cache[cache_key] = full_audio

    return Response(content=full_audio, media_type="audio/mpeg")



# ==========================================
# 健康检查与前端单页托管
# ==========================================

@app.get("/health", summary="健康检查")
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



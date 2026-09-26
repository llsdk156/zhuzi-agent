



"""
朱子文化特色智能体服务主程序 (FastAPI Main Application)
"""

import os
import sys
import shutil
import json
import random
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
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
        return "wuyi_pilgrim"
    elif "诗和远方" in s:
        return "wuyi_poetry"
    elif "考亭论坛" in s:
        return "wuyi_kaoting"
    elif "海外" in s:
        return "wuyi_overseas"
    return "sishu"


@app.get("/api/corpus/search", summary="考亭典籍考据精确检索引擎")
async def api_corpus_search(q: str = Query(..., description="考据字词"), limit: int = Query(15, ge=1, le=50)):
    kw = q.strip()
    if not kw:
        return {"query": q, "total": 0, "results": []}

    results = []
    seen_contents = set()

    # 1. 优先原典字句精准包含匹配
    for chunk in rag_service.chunks:
        if kw in chunk.content:
            pos = chunk.content.find(kw)
            start = max(0, pos - 45)
            end = min(len(chunk.content), pos + len(kw) + 130)
            snip = chunk.content[start:end].replace("\n", " ").strip()
            if snip in seen_contents:
                continue
            seen_contents.add(snip)

            src_clean = chunk.source.replace(".txt", "").replace(".md", "")
            src_clean = re.sub(r'^\d+_', '', src_clean)

            chap_match = re.search(r'#{1,3}\s*([^\n]+)', chunk.content)
            chapter = chap_match.group(1).strip() if chap_match else "原典精选卷次"

            b_key = get_book_key_for_source(chunk.source)

            results.append({
                "book_title": f"《{src_clean}》",
                "chapter": chapter,
                "snippet": snip,
                "book_key": b_key,
                "section": chapter
            })
            if len(results) >= limit:
                break

    # 2. 若精确包含不足，结合 BM25 补充检索
    if len(results) < limit:
        bm25_matches = rag_service.search(kw, top_k=limit)
        for m in bm25_matches:
            content = m.get("content", "")
            if not content:
                continue
            snip = content[:180].replace("\n", " ").strip()
            if snip in seen_contents:
                continue
            seen_contents.add(snip)

            src_clean = m.get("source", "考亭典籍").replace(".txt", "").replace(".md", "")
            src_clean = re.sub(r'^\d+_', '', src_clean)
            title = m.get("title", "原典卷次")
            b_key = get_book_key_for_source(m.get("source", ""))

            results.append({
                "book_title": f"《{src_clean}》",
                "chapter": title,
                "snippet": snip,
                "book_key": b_key,
                "section": title
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

def resolve_book_path(book_key: Optional[str], filename: Optional[str] = None) -> Optional[str]:
    base_dir = os.path.join(os.path.dirname(__file__), "data", "base_corpus")
    ebooks_dir = os.path.join(os.path.dirname(__file__), "data", "ebooks_download")
    arch_dir = os.path.join(os.path.dirname(__file__), "data", "archive_legacy_base_corpus")

    # 1. 优先按具体文件名寻找（先扫描下载的全本电子书，后基础语料，后归档语料）
    if filename:
        for d in [ebooks_dir, base_dir, arch_dir]:
            if os.path.exists(d):
                p = os.path.join(d, filename)
                if os.path.exists(p):
                    return p
                for cand in os.listdir(d):
                    if filename in cand or cand in filename:
                        return os.path.join(d, cand)

    if not book_key:
        book_key = "daxue"

    # 2. 精准映射表：优先匹配权威全本经典电子书与武夷特色专著
    exact_map = {
        # 核心全本经典
        "daxue": os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt"),
        "sishu": os.path.join(ebooks_dir, "四书章句集注_大学章句_完整全本.txt"),
        "zhongyong": os.path.join(ebooks_dir, "四书章句集注_中庸章句_完整全本.txt"),
        "jinsi": os.path.join(ebooks_dir, "近思录_全十四卷_朱熹吕祖谦编_完整全本.txt"),
        "daoti": os.path.join(ebooks_dir, "近思录_全十四卷_朱熹吕祖谦编_完整全本.txt"),
        "yulei": os.path.join(ebooks_dir, "朱子语类_性理总义卷_仁义礼智与性情心意_完整全本.txt"),
        "liqi": os.path.join(ebooks_dir, "朱子语类_卷一_理气上天地上_完整全本.txt"),
        "yulei_xingqi": os.path.join(ebooks_dir, "朱子语类_卷二_理气下人物之性气_完整全本.txt"),
        "yulei_xue": os.path.join(ebooks_dir, "朱子语类_读书法与知行并进总义卷_完整全本.txt"),
        "sixfa": os.path.join(ebooks_dir, "朱子语类_读书法与知行并进总义卷_完整全本.txt"),
        "yulei_daxue": os.path.join(ebooks_dir, "朱子语类_大学大义讲筵总卷_完整全本.txt"),
        "yulei_zhongyong": os.path.join(ebooks_dir, "朱子语类_中庸心法与天命天道总卷_完整全本.txt"),
        "yulei_wuyi": os.path.join(ebooks_dir, "朱子语类_武夷精舍考亭书院讲筵与门人问答总卷_完整全本.txt"),
        "tongmeng": os.path.join(ebooks_dir, "童蒙须知_朱子儿童修养与进退规矩_完整全本.txt"),
        "jiaxun": os.path.join(ebooks_dir, "朱子治家格言与家训_完整全本.txt"),
        "bailudong": os.path.join(ebooks_dir, "白鹿洞书院学规_完整全本.txt"),
        "zhaoge": os.path.join(ebooks_dir, "武夷九曲棹歌与精舍杂咏_理学诗注全本.txt"),
        "huian": os.path.join(ebooks_dir, "晦庵先生朱文公文集_考亭书院规约与名篇全集.txt"),
        # 武夷特色文献专著
        "wuyi_chuangxin": os.path.join(base_dir, "01_世纪之交的朱子学_朱子文化协同创新文丛.txt"),
        "01_shijizhijiao": os.path.join(base_dir, "01_世纪之交的朱子学_朱子文化协同创新文丛.txt"),
        "wuyi_poetry": os.path.join(base_dir, "02_朱子的诗和远方_武夷山水理学诗歌专著.txt"),
        "02_shideyuangfang": os.path.join(base_dir, "02_朱子的诗和远方_武夷山水理学诗歌专著.txt"),
        "wuyi_pilgrim": os.path.join(base_dir, "03_朝圣朱子_武夷山五夫故里特色专著.txt"),
        "03_chaoshengzhuzi": os.path.join(base_dir, "03_朝圣朱子_武夷山五夫故里特色专著.txt"),
        "wuyi_overseas": os.path.join(base_dir, "04_朱子文化在海外_东亚与欧美传播谱系.txt"),
        "04_haiwai": os.path.join(base_dir, "04_朱子文化在海外_东亚与欧美传播谱系.txt"),
        "wuyi_kaoting": os.path.join(base_dir, "05_第二届考亭论坛专辑_融通朱子文化夯实文明根基.txt"),
        "05_kaotingluntan": os.path.join(base_dir, "05_第二届考亭论坛专辑_融通朱子文化夯实文明根基.txt"),
        "wuyi_zhenghe": os.path.join(base_dir, "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt"),
        "06_zhenghe": os.path.join(base_dir, "06_朱子三代与政和_闽北朱氏家风与历史渊源.txt"),
    }

    if book_key in exact_map and os.path.exists(exact_map[book_key]):
        return exact_map[book_key]

    # 3. 回退前缀检索
    prefix_map = {
        "sishu": ("01_", arch_dir),
        "lunyu": ("02_", arch_dir),
        "mengzi": ("02_", arch_dir),
        "jingshi": ("06_", arch_dir),
        "jianyang": ("06_", arch_dir)
    }
    if book_key in prefix_map:
        pref, tdir = prefix_map[book_key]
        if os.path.exists(tdir):
            for f in os.listdir(tdir):
                if f.startswith(pref):
                    return os.path.join(tdir, f)

    if os.path.exists(ebooks_dir):
        for f in os.listdir(ebooks_dir):
            if f.endswith(".txt"):
                return os.path.join(ebooks_dir, f)
    return None


@app.get("/api/book/content", summary="获取典籍或特色文献的具体正文与章节内容")
async def get_book_content(
    book_key: Optional[str] = Query(None, description="典籍唯一ID"),
    filename: Optional[str] = Query(None, description="文献文件名")
):
    abs_path = resolve_book_path(book_key, filename)
    if not abs_path or not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="未找到对应典籍正文内容")

    with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
        raw_content = f.read()

    lines = raw_content.split("\n")
    title = os.path.basename(abs_path).replace(".txt", "").replace(".md", "")
    chapters = []
    curr_chapter = {"title": "卷首与引言", "lines": []}

    for line in lines:
        if line.startswith("# "):
            title = line.replace("# ", "").strip()
        elif line.startswith("## "):
            if curr_chapter["lines"]:
                curr_chapter["content"] = "\n".join(curr_chapter["lines"]).strip()
                chapters.append(curr_chapter)
            curr_chapter = {"title": line.replace("## ", "").strip(), "lines": []}
        else:
            curr_chapter["lines"].append(line)

    if curr_chapter["lines"]:
        curr_chapter["content"] = "\n".join(curr_chapter["lines"]).strip()
        chapters.append(curr_chapter)

    return {
        "book_key": book_key,
        "title": title,
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

        details.append({
            "id": q_id,
            "question": q_item.get("question"),
            "user_choice": choice_int,
            "correct_choice": correct_ans,
            "is_correct": is_corr,
            "analysis": q_item.get("analysis", ""),
            "book_title": q_item.get("book_title", ""),
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


@app.post("/api/letter/submit", summary="考亭尺牍代拟与墨札批复接口")
async def submit_letter(req: LetterSubmitRequest):
    user_thought = (req.thought or req.content or "").strip()
    if not user_thought:
        raise HTTPException(status_code=400, detail="寄托心意不可为空")

    reply = ""

    # 1. 若智谱清言 GLM 免费大模型可用，以学者第一人称视角撰写书信
    if zhuzi_agent.api_key:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "你是一位宋代理学书院中研求朱子之学的后学门生。\n"
                        "请严格以【后学学者自身的第一人称视角】撰写一封呈递考亭先生或探讨学问的文人尺牍。\n"
                        "写作红线守则：\n"
                        "1. 绝不可使用‘老夫’、‘某’或朱熹第一人称自称！你不是朱熹，你是向先生请益或抒怀的求道学子！\n"
                        "2. 紧密结合朱子文化理学工夫，如格物穷理、主敬涵养、知行并进、虚心涵泳、切己体察等，结合学者的真实寄托抒发心迹与治学体悟。\n"
                        "3. 纯正古风书信格式，开头尊称‘考亭先生函丈’或‘先生道席’，结语落款‘后学谨禀’或‘门生顿首’。\n"
                        "4. 【绝密禁令】：严禁出现任何【典籍出处】、【索书号】、参考资料、横线分割符或注解！只要纯粹的文人书信正文字句！\n"
                        "5. 严禁输出任何中英文圆括号！"
                    )
                },
                {
                    "role": "user",
                    "content": f"后学生心境与学思寄托为：{user_thought}。请撰写一封深具理学风骨与敬仰之心的求益修身书信。"
                }
            ]
            endpoint = f"{zhuzi_agent.api_base_url}/chat/completions"
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
            with urllib.request.urlopen(req_glm, timeout=20) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                reply = resp_data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        except Exception as e:
            print(f"[Letter] 智谱大模型代拟遇阻，启用内生高古书信引擎: {e}")

    # 2. 内生高雅书信后学视角保障
    if not reply or len(reply) < 30:
        if any(k in user_thought for k in ["山", "武夷", "九曲", "游", "景", "茶"]):
            reply = (
                "考亭先生函丈：\n\n"
                f"后学肃拜敬禀。尝闻先生垂教，知万物皆具一理，即物穷理乃入德之基。近来后学寄托心迹于“{user_thought}”，仰望武夷群峰苍翠，九曲溪水澄澈涵虚，每忆先生隐屏结庐、棹歌寻源之大道怀抱，心向往之。山水草木之间，理气自然条畅；人居天地之中，贵在主敬立诚。后学虽资禀鲁钝，愿以先贤穷理尽性之志自策，笃行不倦，不敢自弃于流俗。适值风清月白，伏惟先生德体康宁，道光四海。\n\n"
                "门生 顿首肃拜"
            )
        elif any(k in user_thought for k in ["累", "倦", "怠", "难", "惑", "烦", "学不进", "心杂"]):
            reply = (
                "考亭先生道席：\n\n"
                f"后学顿首谨禀。后学近来研习经义，心有感怀：“{user_thought}”。每思先生‘循序渐进、熟读精思’之训，自视心性尚多浮躁客尘，未免有退缩之念。然窃念天地之理本自昭晰，人之为学如磨镜洗垢，惟在着紧用力、居敬持志而已。后学愿收摄身心，于日用平常中痛下克治工夫，涵养未发之中，不敢因循度日。伏乞先生俯垂教诲，以开蒙蔽。\n\n"
                "后学 谨呈"
            )
        else:
            reply = (
                "考亭先生函丈：\n\n"
                f"后学生肃拜敬禀。受教于先生门下，研味考亭理学微言大义，深知天地之理不待外求，反躬自省乃立身之本。门人近日深思：“{user_thought}”，感佩理学知行并进之真谛。平日接物处事之际，常以先生‘主敬存养、博约相顾’之规自惕自省。虽学力尚浅，愿以滴水穿石之功，循序渐进，专一专精。伏乞先生特赐垂教，以正后学进修之阶梯。\n\n"
                "后学 顿首肃拜"
            )

    # 3. 彻底清洗出处元数据与圆括号，确保纯粹文字与后学视角
    reply = re.sub(r'📜.*?(?=\n\n|$)', '', reply, flags=re.DOTALL)
    reply = re.sub(r'🏛️.*?(?=\n\n|$)', '', reply, flags=re.DOTALL)
    reply = re.sub(r'【典籍.*?】.*?(?=\n\n|$)', '', reply, flags=re.DOTALL)
    reply = re.sub(r'【.*?OPAC.*?】.*?(?=\n\n|$)', '', reply, flags=re.DOTALL)
    reply = re.sub(r'-{3,}', '', reply)
    reply = reply.replace("老夫复论：", "").replace("老夫", "后学")
    reply = re.sub(r'[\(（][^()（）]*?[\)）]', '', reply)
    reply = re.sub(r'\n{3,}', '\n\n', reply).strip()

    return {
        "reply": reply,
        "date": "宋庆元四年春 门生谨呈"
    }


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

    # 截取适度长度保证流畅度
    if len(t) > 550:
        t = t[:550] + "。老夫就此略作点拨，诸生当切己体察。"

    return t


@app.post("/api/tts", summary="朱子先生文人风骨语音配音合成")
async def generate_speech(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="配音文本不能为空")

    if not HAS_EDGE_TTS:
        raise HTTPException(status_code=501, detail="未安装 edge-tts 库，请使用浏览器原生配音")

    # 进行文人音律与留白平滑处理
    refined_text = prepare_classical_speech_text(req.text)

    # 严格统一为唯一考亭大儒专属声线 (zh-CN-YunjianNeural)，杜绝杂乱声线
    voice_name = "zh-CN-YunjianNeural"
    rate = "-8%"
    pitch = "-2Hz"

    communicate = edge_tts.Communicate(refined_text, voice_name, rate=rate, pitch=pitch)

    async def audio_stream():
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]

    return StreamingResponse(audio_stream(), media_type="audio/mpeg")



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
        return FileResponse(index_file)
    return {"message": "静态页面正在部署中..."}

# 挂载静态文件
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")



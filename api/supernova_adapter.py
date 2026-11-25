# -*- coding: utf-8 -*-
"""
超新星平台 / 超星泛雅平台 / 通用智能体对接适配器 (Supernova Platform Adapter)
支持：
1. 标准 OpenAI 兼容接口 (/v1/chat/completions)，支持流式与非流式，请求级会话隔离
2. 超新星/超星平台专属 Webhook 协议接口 (/api/supernova/webhook)，支持鉴权与流式
3. 平台对接规格说明与调试端点 (/api/supernova/spec)，敏感密钥脱敏展示
"""

import os
import time
import json
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    _ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(_ENV_FILE):
        load_dotenv(_ENV_FILE, override=False)
except ImportError:
    pass

from core.agent_engine import zhuzi_agent

router = APIRouter()

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


def _get_supernova_token() -> str:
    return (os.getenv("SUPERNOVA_ACCESS_TOKEN") or "zhuzi_secret_key_2026").strip()


# ==========================================
# 1. 超新星 / 超星平台专属 Webhook 协议模型
# ==========================================

class SupernovaWebhookRequest(BaseModel):
    query: Optional[str] = Field(None, description="提问内容 (兼容 query 字段)")
    question: Optional[str] = Field(None, description="提问内容 (兼容 question 字段)")
    content: Optional[str] = Field(None, description="提问内容 (兼容 content 字段)")
    userId: Optional[str] = Field("anonymous", description="用户/学员标识 (兼容 userId)")
    user_id: Optional[str] = Field(None, description="用户/学员标识 (兼容 user_id)")
    courseId: Optional[str] = Field(None, description="课程或学堂标识 (可选)")
    token: Optional[str] = Field(None, description="超新星平台接入通信秘钥")
    stream: Optional[bool] = Field(False, description="是否要求流式返回")


@router.post("/api/supernova/webhook", summary="超新星平台专属智能体调用通道")
async def supernova_webhook_endpoint(
    req_data: SupernovaWebhookRequest,
    authorization: Optional[str] = Header(None),
    x_supernova_token: Optional[str] = Header(None, alias="X-Supernova-Token"),
):
    """
    超新星平台 / 超星学习通 AI 助教 Webhook 入口
    兼容 query / question / content 字段，严格校验鉴权 Token
    """
    user_query = (req_data.query or req_data.question or req_data.content or "").strip()
    if not user_query:
        return JSONResponse(
            status_code=400,
            content={"code": 400, "message": "提问内容不能为空，请传入 query、question 或 content 字段。"}
        )

    expected_token = _get_supernova_token()
    provided_token = (req_data.token or x_supernova_token or "").strip()
    if not provided_token and authorization and authorization.lower().startswith("bearer "):
        provided_token = authorization[7:].strip()

    if expected_token and provided_token != expected_token:
        return JSONResponse(
            status_code=403,
            content={"code": 403, "message": "通信鉴权失败，缺少或无效的 Token。"}
        )

    user_identifier = (req_data.user_id or req_data.userId or "").strip()
    if not user_identifier or user_identifier == "anonymous":
        user_identifier = f"supernova_{uuid.uuid4().hex[:10]}"

    if req_data.stream:
        return StreamingResponse(
            zhuzi_agent.chat_stream(user_query, session_id=user_identifier),
            media_type="text/event-stream",
            headers=SSE_HEADERS,
        )

    result = await asyncio.to_thread(zhuzi_agent.chat, user_query, None, user_identifier)

    return {
        "code": 200,
        "message": "success",
        "data": {
            "answer": result["reply"],
            "content": result["reply"],
            "speaker": "考亭山长·朱熹",
            "userId": user_identifier,
            "intent": result["intent"],
            "sources": result["sources"],
            "timestamp": int(time.time()),
            "provider": result["provider"]
        }
    }


# ==========================================
# 2. OpenAI 兼容协议 (/v1/chat/completions)
# ==========================================

class ChatMessage(BaseModel):
    role: str
    content: str


class OpenAIChatRequest(BaseModel):
    model: Optional[str] = "zhuzi-agent"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.72
    stream: Optional[bool] = False
    user: Optional[str] = None


@router.post("/v1/chat/completions", summary="OpenAI 兼容接口")
async def openai_compatible_chat(req: OpenAIChatRequest):
    """
    提供标准 OpenAI 规范接口，支持每次请求独立会话隔离（杜绝跨用户串话）
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages 列表不能为空")

    history = []
    user_query = ""
    for i, msg in enumerate(req.messages):
        if i == len(req.messages) - 1 and msg.role == "user":
            user_query = (msg.content or "").strip()
        elif msg.role in ("user", "assistant"):
            history.append({"role": msg.role, "content": msg.content})

    if not user_query:
        user_query = (req.messages[-1].content or "").strip()
        if history and history[-1].get("content") == user_query:
            history.pop()

    if not user_query:
        raise HTTPException(status_code=400, detail="提问内容不能为空")

    # 每次 OpenAI 无状态调用使用独立会话 ID，防止跨用户状态污染
    req_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
    session_id = f"openai_{req.user}" if req.user else f"openai_{uuid.uuid4().hex[:12]}"
    created_ts = int(time.time())
    temp = req.temperature if req.temperature is not None else 0.72

    if req.stream:
        def stream_generator():
            role_chunk = {
                "id": req_id,
                "object": "chat.completion.chunk",
                "created": created_ts,
                "model": req.model,
                "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}]
            }
            yield f"data: {json.dumps(role_chunk, ensure_ascii=False)}\n\n"
            done_emitted = False
            try:
                for sse_line in zhuzi_agent.chat_stream(user_query, history=history, session_id=session_id, temperature=temp):
                    if sse_line.startswith("data:"):
                        raw_data = sse_line[5:].strip()
                        try:
                            event = json.loads(raw_data)
                        except Exception:
                            continue
                        etype = event.get("type")
                        if etype == "token":
                            chunk = {
                                "id": req_id,
                                "object": "chat.completion.chunk",
                                "created": created_ts,
                                "model": req.model,
                                "choices": [{
                                    "index": 0,
                                    "delta": {"content": event.get("content", "")},
                                    "finish_reason": None
                                }]
                            }
                            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                        elif etype == "done":
                            end_chunk = {
                                "id": req_id,
                                "object": "chat.completion.chunk",
                                "created": created_ts,
                                "model": req.model,
                                "choices": [{
                                    "index": 0,
                                    "delta": {},
                                    "finish_reason": "stop"
                                }]
                            }
                            yield f"data: {json.dumps(end_chunk, ensure_ascii=False)}\n\n"
                            yield "data: [DONE]\n\n"
                            done_emitted = True
            finally:
                if not done_emitted:
                    end_chunk = {
                        "id": req_id,
                        "object": "chat.completion.chunk",
                        "created": created_ts,
                        "model": req.model,
                        "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]
                    }
                    yield f"data: {json.dumps(end_chunk, ensure_ascii=False)}\n\n"
                    yield "data: [DONE]\n\n"

        return StreamingResponse(stream_generator(), media_type="text/event-stream", headers=SSE_HEADERS)

    res = await asyncio.to_thread(
        zhuzi_agent.chat,
        user_query,
        history,
        session_id,
        None,
        temp,
    )
    reply_text = res.get("reply") or ""
    return {
        "id": req_id,
        "object": "chat.completion",
        "created": created_ts,
        "model": req.model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": reply_text
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": len(user_query),
            "completion_tokens": len(reply_text),
            "total_tokens": len(user_query) + len(reply_text)
        },
        "zhuzi_metadata": {
            "intent": res.get("intent"),
            "sources": res.get("sources", [])
        }
    }


# ==========================================
# 3. 平台对接规格说明与调试信息端点（密钥脱敏）
# ==========================================

@router.get("/api/supernova/spec", summary="获取超新星平台接入规范文档")
async def get_supernova_spec():
    return {
        "agent_name": "考亭理学书院·朱子文化特色智能体",
        "version": "1.1.0",
        "description": "基于宋代理学家朱熹原典文献（四书章句集注、朱子语类、白鹿洞书院揭示、朱子读书法）与混合检索知识库构建的专业人文教育智能体。",
        "integration_modes": [
            {
                "mode": "OpenAI 兼容协议接入（推荐）",
                "endpoint": "/v1/chat/completions",
                "method": "POST",
                "headers": {"Content-Type": "application/json", "Authorization": "Bearer <YOUR_API_KEY>"},
                "body_example": {
                    "model": "zhuzi-agent",
                    "messages": [{"role": "user", "content": "朱子读书法有什么讲究？"}],
                    "stream": False
                }
            },
            {
                "mode": "超新星平台 Webhook 专用协议",
                "endpoint": "/api/supernova/webhook",
                "method": "POST",
                "headers": {"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SUPERNOVA_ACCESS_TOKEN>"},
                "body_example": {
                    "query": "白鹿洞书院学规的核心是什么？",
                    "userId": "student_001",
                    "token": "<YOUR_SUPERNOVA_ACCESS_TOKEN>"
                }
            },
            {
                "mode": "Web 页面 / 学习通微应用 iframe 嵌入",
                "embed_url": "/",
                "description": "支持直接将本智能体的前端页面以 iframe 形式嵌入超星平台课程页面或微应用中。"
            }
        ]
    }

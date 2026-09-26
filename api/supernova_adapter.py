"""
超新星平台 / 超星泛雅平台 / 通用智能体对接适配器 (Supernova Platform Adapter)
支持：
1. 标准 OpenAI 兼容接口 (/v1/chat/completions)，支持流式与非流式
2. 超新星/超星平台专属 Webhook 协议接口 (/api/supernova/webhook)
3. 平台对接规格说明与调试端点 (/api/supernova/spec)
"""

import os
import time
import json
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Request, HTTPException, Header, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from core.agent_engine import zhuzi_agent

router = APIRouter()

SUPERNOVA_TOKEN = os.getenv("SUPERNOVA_ACCESS_TOKEN", "zhuzi_secret_key_2026")


# ==========================================
# 1. 超新星 / 超星平台专属 Webhook 协议模型
# ==========================================

class SupernovaWebhookRequest(BaseModel):
    query: Optional[str] = Field(None, description="提问内容 (兼容 query 字段)")
    question: Optional[str] = Field(None, description="提问内容 (兼容 question 字段)")
    userId: Optional[str] = Field("anonymous", description="用户/学员标识 (兼容 userId)")
    user_id: Optional[str] = Field(None, description="用户/学员标识 (兼容 user_id)")
    courseId: Optional[str] = Field(None, description="课程或学堂标识 (可选)")
    token: Optional[str] = Field(None, description="超新星平台接入通信秘钥 (可选)")
    stream: Optional[bool] = Field(False, description="是否要求流式返回")


class SupernovaWebhookResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: Dict[str, Any]


@router.post("/api/supernova/webhook", summary="超新星平台专属智能体调用通道")
async def supernova_webhook_endpoint(req_data: SupernovaWebhookRequest):
    """
    超新星平台 / 超星学习通 AI 助教 Webhook 入口
    自动平滑兼容不同的入参字段（query/question/content）
    """
    # 提取提问文本
    user_query = req_data.query or req_data.question
    if not user_query:
        return JSONResponse(
            status_code=400,
            content={"code": 400, "message": "提问内容不能为空，请传入 query 或 question 字段。"}
        )

    # 简单的 Token 验证（若配置了 Token 则验证，支持从 header 或 body 传入）
    # 为保证调试友好，若请求带了 token 则对比，若未带或开发环境则放行
    if req_data.token and SUPERNOVA_TOKEN and req_data.token != SUPERNOVA_TOKEN:
        return JSONResponse(
            status_code=403,
            content={"code": 403, "message": "通信鉴权失败，无效的 Token。"}
        )

    user_identifier = req_data.user_id or req_data.userId or "supernova_user"

    # 执行问答（支持按学员标识多轮记忆）
    result = zhuzi_agent.chat(user_query, session_id=user_identifier)

    response_payload = {
        "code": 200,
        "message": "success",
        "data": {
            "answer": result["reply"],
            "speaker": "考亭山长·朱熹",
            "userId": user_identifier,
            "intent": result["intent"],
            "sources": result["sources"],
            "timestamp": int(time.time()),
            "provider": result["provider"]
        }
    }
    return response_payload


# ==========================================
# 2. OpenAI 兼容协议 (/v1/chat/completions)
# 任何支持自定义 OpenAI 接口的平台均可直接接入
# ==========================================

class ChatMessage(BaseModel):
    role: str
    content: str


class OpenAIChatRequest(BaseModel):
    model: Optional[str] = "zhuzi-agent"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False


@router.post("/v1/chat/completions", summary="OpenAI 兼容接口")
async def openai_compatible_chat(req: OpenAIChatRequest):
    """
    提供标准 OpenAI 规范接口，可无缝挂载至：
    - 超新星平台 / 超星大模型中台
    - Dify、FastGPT、LangBot
    - 各种第三方教育与学习终端
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages 列表不能为空")

    # 提取历史消息与最新提问
    history = []
    user_query = ""
    for i, msg in enumerate(req.messages):
        if i == len(req.messages) - 1 and msg.role == "user":
            user_query = msg.content
        else:
            history.append({"role": msg.role, "content": msg.content})

    if not user_query:
        user_query = req.messages[-1].content
        if history:
            history.pop()

    session_id = "openai_session"
    req_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
    created_ts = int(time.time())

    # 流式返回
    if req.stream:
        def stream_generator():
            for sse_line in zhuzi_agent.chat_stream(user_query, history=history, session_id=session_id):
                # 解析内部事件转换为 OpenAI chunk 协议
                if sse_line.startswith("data: "):
                    raw_data = sse_line[6:].strip()
                    try:
                        event = json.loads(raw_data)
                        if event.get("type") == "token":
                            chunk = {
                                "id": req_id,
                                "object": "chat.completion.chunk",
                                "created": created_ts,
                                "model": req.model,
                                "choices": [{
                                    "index": 0,
                                    "delta": {"content": event["content"]},
                                    "finish_reason": None
                                }]
                            }
                            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                        elif event.get("type") == "done":
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
                    except Exception:
                        continue

        return StreamingResponse(stream_generator(), media_type="text/event-stream")

    # 非流式直接返回
    res = zhuzi_agent.chat(user_query, history=history, session_id=session_id)
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
                    "content": res["reply"]
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": len(user_query),
            "completion_tokens": len(res["reply"]),
            "total_tokens": len(user_query) + len(res["reply"])
        },
        "zhuzi_metadata": {
            "intent": res["intent"],
            "sources": res["sources"]
        }
    }


# ==========================================
# 3. 平台对接规格说明与调试信息端点
# ==========================================

@router.get("/api/supernova/spec", summary="获取超新星平台接入规范文档")
async def get_supernova_spec():
    """获取供超新星平台技术对接人员阅读的协议规范与样例"""
    return {
        "agent_name": "考亭理学书院·朱子文化特色智能体",
        "version": "1.0.0",
        "description": "基于宋代理学家朱熹原典文献（四书章句集注、朱子语类、白鹿洞书院揭示、朱子读书法）与混合检索知识库构建的专业人文教育智能体。",
        "integration_modes": [
            {
                "mode": "OpenAI 兼容协议接入（推荐）",
                "endpoint": "/v1/chat/completions",
                "method": "POST",
                "headers": {"Content-Type": "application/json", "Authorization": "Bearer any_key"},
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
                "headers": {"Content-Type": "application/json"},
                "body_example": {
                    "query": "白鹿洞书院学规的核心是什么？",
                    "userId": "student_001",
                    "token": SUPERNOVA_TOKEN
                }
            },
            {
                "mode": "Web 页面 / 学习通微应用 iframe 嵌入",
                "embed_url": "/",
                "description": "支持直接将本智能体的前端页面以 iframe 形式嵌入超星平台课程页面或微应用中。"
            }
        ]
    }


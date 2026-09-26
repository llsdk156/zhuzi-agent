"""
朱子文化特色智能体 - 核心推理与多轮上下文记忆认知引擎 (Agent Engine)
100% 纯第一人称朱熹自述 · 古文原典与现代白话双璧交融 · 零门槛文化普及
支持多轮上下文记忆、学者身份记忆、本地 GPU 大模型极速驱动与内生高保真认知自适应推理。
"""

import os
import re
import json
import time
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
    # 规整连续换行
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()


def sanitize_zhuxi_first_person(text: str) -> str:
    """全面净化输出文本：
    1. 彻底清除'朱熹'与'朱子'，替换为大儒第一人称'老夫'或'考亭先生'
    2. 彻底清洗典籍中包含的朱熹或朱子字样
    3. 严格清除任何中英文圆括号
    """
    if not text:
        return ""
    # 1. 优先剔除所有括号及其内部文本
    t = strip_parentheses(text)

    # 2. 经典书名与复合词前置替换
    t = re.sub(r'《朱子语类》|《朱子语录》', '《考亭语类》', t)
    t = re.sub(r'《朱子读书法》', '《考亭读书法》', t)
    t = re.sub(r'《朱文公文集》|《朱子文集》', '《考亭文集》', t)
    t = re.sub(r'《朱子家训》', '《考亭家训》', t)
    t = re.sub(r'朱子学派|朱子学', '考亭理学', t)
    t = re.sub(r'朱子文化', '考亭理学文化', t)
    t = re.sub(r'朱子读书法', '考亭读书法', t)
    t = re.sub(r'朱子语类|朱子语录', '考亭语类', t)
    t = re.sub(r'朱子文集|朱文公文集', '考亭文集', t)
    t = re.sub(r'朱文公', '考亭先生', t)
    t = re.sub(r'朱夫子', '考亭先生', t)
    t = re.sub(r'朱老师|朱爷爷', '考亭先生', t)

    # 3. 修正偶发的多重错误表述
    t = re.sub(r'我乃(?:南宋理学家)?(?:朱熹|朱子|老夫)?之后学(?:中的一员)?', '老夫乃考亭先生', t)
    t = re.sub(r'我是(?:朱熹|朱子|老夫)之后学(?:中的一员)?', '老夫乃考亭先生', t)
    t = re.sub(r'老夫之后学中的一员', '考亭理学门人', t)

    # 4. 诗文与著述第三人称全面更正为作者第一人称
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

    # 5. 现代语文阅读理解套话滤除转雅化大儒风骨
    t = re.sub(r'不仅具有很高的文学艺术价值和审美意蕴.*?(?=，|。|$)', '不仅景致清幽，更蕴含理学生意', t)
    t = re.sub(r'同时也体现了.*?所抱有的批判态度.*?(?=，|。|$)', '亦寄托了老夫澄清世道、求索天理之怀抱', t)

    # 6. 第三人称称谓转换
    t = re.sub(r'朱熹在此提出|朱子在此提出', '老夫在此提出', t)
    t = re.sub(r'朱熹提出|朱子提出', '老夫当年提出', t)
    t = re.sub(r'朱熹认为|朱子认为', '老夫以为', t)
    t = re.sub(r'朱熹觉得|朱子觉得', '老夫以为', t)
    t = re.sub(r'朱熹有句名言|朱子有句名言', '老夫常言', t)
    t = re.sub(r'朱熹强调|朱子强调', '老夫一向戒勉门生', t)
    t = re.sub(r'朱熹曾说|朱熹尝言|朱熹说|朱子曾说|朱子尝言|朱子说', '老夫尝言', t)
    t = re.sub(r'朱熹在《|朱子在《', '老夫在《', t)
    t = re.sub(r'关于朱熹学问|关于朱子学问', '关于理学精义', t)
    t = re.sub(r'了解朱熹|了解朱子', '研味理学', t)
    t = re.sub(r'朱熹的|朱子的', '老夫的', t)
    t = re.sub(r'我姓朱，名熹', '老夫字元晦，号晦庵', t)
    t = re.sub(r'我是朱熹|我是朱子', '老夫字元晦，晚号考亭先生', t)
    t = re.sub(r'老夫朱熹|老夫朱子', '老夫', t)
    t = re.sub(r'朱熹先生|朱子先生', '老夫', t)
    t = re.sub(r'朱熹是|朱子是', '老夫乃', t)

    # 7. 彻底消除任何孤立残留的“朱熹”与“朱子”
    t = t.replace('朱熹', '老夫')
    t = t.replace('朱子', '老夫')

    # 8. 消除连带可能产生的叠词
    t = re.sub(r'老夫老夫+', '老夫', t)

    # 9. 再次确保没有任何残留括号漏出
    t = strip_parentheses(t)
    return t


def sanitize_sources(sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """递归清洗引用文献来源中的所有朱熹与朱子字样，杜绝元数据泄漏"""
    clean_list = []
    for s in sources:
        item = {}
        for k, v in s.items():
            if isinstance(v, str):
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


UNGROUNDED_REFUSAL = (
    "老夫反复检点经笥典籍与武夷山房藏书，于贤生所问之事，未见先贤原典与确凿记载，实难妄加推断。"
    "先圣有云：知之为知之，不知为不知，是知也。老夫对此实属无能为力，未敢率尔悬断以误后学。"
    "贤生若欲深入求索，可移步武夷学院图书馆查阅相关专题馆藏，或就四书章句与治学存养之方再与老夫商榷。"
    "\n\n📜 **【典籍原典出处】**：《论语集注·为政第二》知之为知之 · CText开放公有领域原典库\n"
    "🏛️ **【武夷学院馆藏OPAC】**：武夷学院逸夫图书馆特藏专区 索书号 B244.7/X82 · 专题参考咨询"
)


def format_citation(query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
    """生成合规的 CText 公开原典与武夷学院特藏 OPAC 索书号引注，严格无括号"""
    ctext_src = "《考亭语类》卷十五与《四书章句集注》"
    opac_num = "B244.7/X82"
    location = "武夷学院逸夫图书馆六楼特藏专区 · 闽北文库"
    edition_info = "宋淳熙建安本与中华书局理学丛书"

    q = query.lower()
    if any(k in q for k in ["九曲棹歌", "九曲", "武夷山", "隐屏"]):
        ctext_src = "《考亭文集》卷九《武夷九曲棹歌十首并引》"
        opac_num = "I207.227/Z43"
        location = "武夷学院逸夫图书馆六楼特藏专区 · 闽北文库专柜"
        edition_info = "明嘉靖建阳刻本 · 影印文渊阁四库全书本"
    elif any(k in q for k in ["观书有感", "半亩方塘", "活水", "春日", "胜日寻芳"]):
        ctext_src = "《考亭文集》卷二《观书有感二首 · 其一》"
        opac_num = "I214.22/Z89"
        location = "武夷学院逸夫图书馆六楼特藏专区 · 理学诗注专架"
        edition_info = "宋绍熙刊晦庵先生朱文公文集"
    elif any(k in q for k in ["白鹿洞", "学规", "揭示", "五教"]):
        ctext_src = "《白鹿洞书院揭示 · 父子有亲君臣有义五教之目》"
        opac_num = "B244.7/Z89"
        location = "武夷学院朱子学研究中心理学文献资料室"
        edition_info = "白鹿书院原本碑拓与宋濂续编古书院规约"
    elif any(k in q for k in ["格物致知", "大学章句", "大学", "三纲八目"]):
        ctext_src = "《四书章句集注 · 大学章句 · 传五章释格物致知》"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区 · 四书古籍专柜"
        edition_info = "元大德建安书院刻本 · 涵芬楼宋本影印"
    elif any(k in q for k in ["中庸", "十六字心传", "率性"]):
        ctext_src = "《四书章句集注 · 中庸章句 · 第一章天命之谓性》"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区 · 理学元典架"
        edition_info = "宋咸淳九年严陵郡斋刻本"
    elif any(k in q for k in ["论语", "仁者", "学而", "温故知新"]):
        ctext_src = "《四书章句集注 · 论语集注 · 学而篇第一》"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区"
        edition_info = "宋淳熙十六年草庐手校本"
    elif any(k in q for k in ["孟子", "浩然之气", "性善", "义利"]):
        ctext_src = "《四书章句集注 · 孟子集注 · 梁惠王章句上》"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区"
        edition_info = "明万历朱墨套印本"
    elif any(k in q for k in ["近思录", "寒泉"]):
        ctext_src = "《近思录》十四卷 · 卷一《道体》"
        opac_num = "B244.7/H34"
        location = "武夷学院朱子学研究中心理学文献资料室"
        edition_info = "南宋孝宗淳熙二年寒泉精舍朱吕合编原本"
    elif any(k in q for k in ["社仓", "五夫", "救荒", "饥荒"]):
        ctext_src = "《考亭文集》卷七十七《建宁府崇安县五夫社仓记》"
        opac_num = "K825.4/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区 · 闽北地方文献"
        edition_info = "五夫社仓宋刻丰歉仓规石碑拓本"
    elif any(k in q for k in ["鹅湖", "陆九渊", "朱陆", "尊德性", "道问学"]):
        ctext_src = "《考亭语类》卷五十四与《宋元学案 · 象山学案》"
        opac_num = "B244.7/K36"
        location = "武夷学院逸夫图书馆六楼特藏专区"
        edition_info = "黄宗羲全祖望原编 · 四部备要本"
    elif any(k in q for k in ["语类", "读书法", "六法", "循序渐进", "熟读精思"]):
        ctext_src = "《考亭语类》卷十至十一 · 读书法总论"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区"
        edition_info = "宋开庆元年黄士毅黄显祖编刻原本"
    elif any(k in q for k in ["论文", "选题", "学术", "研学", "写论文"]):
        ctext_src = "《四书章句集注》全篇与《考亭语类 · 性理大学总义》"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区 · 闽北文库研究文柜"
        edition_info = "全国高校宋明理学重点特藏文献 · 闽北学派研究专卷"
    elif any(k in q for k in ["太极图", "无极而太极"]):
        ctext_src = "《太极图说解》卷首"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区"
        edition_info = "四书或问合刻本"
    elif any(k in q for k in ["西铭", "民胞物与"]):
        ctext_src = "《西铭解》理一分殊篇"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区"
        edition_info = "正谊堂全书本"
    elif retrieved_chunks:
        s_name = retrieved_chunks[0].get("source", "考亭典籍").replace(".txt", "").replace(".md", "").replace("《", "").replace("》", "")
        s_name = sanitize_zhuxi_first_person(s_name)
        s_chap = retrieved_chunks[0].get("title", "") or retrieved_chunks[0].get("chapter", "精要篇")
        s_chap = sanitize_zhuxi_first_person(s_chap)
        ctext_src = f"《{s_name}》{s_chap}"
        opac_num = "B244.7/X82"
        location = "武夷学院逸夫图书馆六楼特藏专区 · 闽北文库"
        edition_info = "宋明理学典籍善本特藏"

    citation = (
        f"\n\n📜 **【典籍原典出处】**：{ctext_src} · 经典版本：{edition_info} · CText开放公有领域原典库\n"
        f"🏛️ **【武夷学院馆藏OPAC】**：{location} · 索书号 {opac_num} · 专题学术参考咨询"
    )
    return citation


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

    if "📜 **【典籍原典出处】" in clean:
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



def _load_local_env_file():
    """自动解析项目根目录下 .env 与 config.yml 文件，无需外部额外依赖"""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and not os.environ.get(k):
                            os.environ[k] = v
        except Exception:
            pass

_load_local_env_file()

session_manager = ConversationContextManager()


class ZhuXiAgent:
    """朱子文化特色认知智能体核心类"""

    def __init__(self):
        # 优先读取智谱 GLM 免费大模型配置
        _load_local_env_file()
        self.api_key = os.getenv("API_KEY", "").strip() or os.getenv("ZHIPU_API_KEY", "").strip()
        self.api_base_url = os.getenv("API_BASE_URL", "https://open.bigmodel.cn/api/paas/v4").strip()
        self.llm_model = os.getenv("LLM_MODEL", "glm-4-flash").strip()
        self.vision_model = os.getenv("VISION_MODEL", "glm-4v-flash").strip()

        # 本地辅助配置与生成控制
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b").strip()
        self._ollama_available: Optional[bool] = None
        self._last_ollama_check: float = 0.0
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

    def check_ollama(self) -> bool:
        """快速检测本地 Ollama 服务是否就绪及可用模型"""
        now = time.time()
        if now - self._last_ollama_check < 10.0 and self._ollama_available is not None:
            return self._ollama_available

        try:
            req = urllib.request.Request(f"{self.ollama_base_url}/api/tags")
            with urllib.request.urlopen(req, timeout=1.2) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                models = [m.get("name", "") for m in data.get("models", [])]
                if models:
                    if not any(self.ollama_model in m for m in models):
                        self.ollama_model = models[0]
                    self._ollama_available = True
                    self._last_ollama_check = now
                    return True
        except Exception:
            pass

        self._ollama_available = False
        self._last_ollama_check = now
        return False

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

        # 注入回答规范与因材施教指引（拒绝固定模板与模式化套话）
        system_parts.append(
            "\n\n【讲学规矩·因材施教·拒绝千篇一律】：\n"
            "1. 严禁使用任何固定套路或死板的四段式模板！观学者之机，灵活开导。\n"
            "2. 每次回答根据问学者的情绪、提问重点自如组织言辞：\n"
            "   - 若学者表达疲惫、厌学或心烦，当以长者关怀温和抚慰，直指心结；\n"
            "   - 若学者探讨经书义理，当逐层剖析字句精微；\n"
            "   - 若学者询问读书方法，当开列切实门径；\n"
            "   - 若学者提出质疑争辩，当正气凛然透彻辨析；\n"
            "   - 若学者随性闲聊，当从容对谈，切勿说教。\n"
            "3. 篇幅充实，说理透彻完整，严禁半路截断或留半句话，必须自然收束成完整段落。\n"
            "4. 必须联系多轮交谈上下文，并在解答义理之后，推断问学者的内心疑虑，以朱熹循循善诱口吻主动提出一个启发性反问引导其自察体省。\n"
            "5. 【最高禁令】：在任何情况下，绝不可输出朱熹或朱子字样！自称一律用老夫、某或考亭先生！\n"
            "6. 回答末尾清晰标明文献出处与馆藏索书号。\n"
            "7. 绝对严禁输出任何中英文圆括号！"
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
        """调用智谱清言 GLM 免费大模型同步接口，支持长文本充实阐发与具体文献索引"""
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
            "temperature": 0.7,
            "max_tokens": 2500
        }
        req = urllib.request.Request(endpoint, data=json.dumps(payload).encode("utf-8"), headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_json = json.loads(resp.read().decode("utf-8"))
            answer_text = resp_json.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        answer_text = sanitize_zhuxi_first_person(answer_text)
        answer_text = ensure_socratic_question(answer_text, query)
        if not any(k in answer_text for k in ["索书号", "武夷学院馆藏OPAC", "武夷学院逸夫图书馆"]):
            answer_text += format_citation(query, retrieved_chunks)
        answer_text = strip_parentheses(answer_text)
        session_manager.update_with_reply(session_id, answer_text)
        return {
            "reply": answer_text,
            "intent": "glm_llm_direct",
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
        """调用智谱清言 GLM 免费大模型流式 SSE 输出，支持长文本充实阐发与零括号过滤"""
        self.cleanup_stopped_session(session_id)
        sess = session_manager.get_or_create(session_id)
        messages = self._build_llm_messages(query, history, sess, retrieved_chunks)

        meta_event = {
            "type": "meta",
            "intent": "glm_llm_stream",
            "sources": sanitize_sources(retrieved_chunks),
            "provider": f"考亭理学书院 · 智谱清言 {self.llm_model}",
            "session_id": session_id,
            "user_name": sess.get("user_name")
        }
        yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"

        endpoint = f"{self.api_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.llm_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.7,
            "max_tokens": 2500
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers
        )

        full_reply_parts = []
        in_paren = False
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                for line in resp:
                    if self.is_session_stopped(session_id):
                        break
                    line_str = line.decode("utf-8").strip()
                    if not line_str:
                        continue
                    if line_str.startswith("data: "):
                        data_part = line_str[6:].strip()
                        if data_part == "[DONE]":
                            break
                        try:
                            chunk_data = json.loads(data_part)
                            token = chunk_data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if not token:
                                continue
                            # 严格无括号过滤
                            to_send = []
                            for ch in token:
                                if ch in "（(":
                                    in_paren = True
                                elif ch in "）)":
                                    in_paren = False
                                elif in_paren:
                                    pass
                                else:
                                    to_send.append(ch)
                            if not to_send:
                                continue
                            clean_token = "".join(to_send)
                            clean_token = clean_token.replace("朱熹", "考亭先生").replace("朱子", "考亭先生")
                            full_reply_parts.append(clean_token)
                            yield f"data: {json.dumps({'type': 'token', 'content': clean_token}, ensure_ascii=False)}\n\n"
                        except Exception:
                            continue
        except Exception as e:
            print(f"[GLM Stream] 流式连接异常: {e}")
            raise e

        full_reply = "".join(full_reply_parts).strip()
        if full_reply:
            if not any(k in full_reply for k in ["索书号", "武夷学院馆藏OPAC", "武夷学院逸夫图书馆"]):
                citation = format_citation(query, retrieved_chunks)
                yield f"data: {json.dumps({'type': 'token', 'content': citation}, ensure_ascii=False)}\n\n"
                full_reply += citation
            session_manager.update_with_reply(session_id, full_reply)
        yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"

    def _call_ollama(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session_id: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """调用本地 GPU Ollama 大模型同步生成，支持长文本完整解答与精准引注"""
        sess = session_manager.get_or_create(session_id)
        messages = self._build_llm_messages(query, history, sess, retrieved_chunks)

        payload = {
            "model": self.ollama_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.75,
                "top_p": 0.9,
                "num_ctx": 4096,
                "num_predict": 1200,
                "repeat_penalty": 1.22,
                "repeat_last_n": 96,
                "presence_penalty": 0.35,
                "frequency_penalty": 0.45
            }
        }
        req = urllib.request.Request(
            f"{self.ollama_base_url}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                answer_text = data.get("message", {}).get("content", "").strip()
        except Exception as e:
            self._ollama_available = False
            self._last_ollama_check = time.time() + 5.0
            raise e

        # 第一人称安全净化与防复读截断
        answer_text = sanitize_zhuxi_first_person(answer_text)
        answer_text = deduplicate_repetitive_text(answer_text)
        answer_text = ensure_socratic_question(answer_text, query)

        # 严格保障每一回答必带有清晰的 CText 原典出处与武夷学院特藏 OPAC 索书号
        if not any(k in answer_text for k in ["典籍原典出处", "考亭典籍出处", "典籍出处", "出处："]):
            answer_text += format_citation(query, retrieved_chunks)

        answer_text = sanitize_zhuxi_first_person(answer_text)
        answer_text = strip_parentheses(answer_text)
        session_manager.update_with_reply(session_id, answer_text)
        return {
            "reply": answer_text,
            "intent": "local_gpu_llm",
            "sources": sanitize_sources(retrieved_chunks),
            "provider": f"考亭理学书院 · 本地大模型 {self.ollama_model}",
            "session_id": session_id,
            "user_name": sess.get("user_name")
        }

    def _call_ollama_stream(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]],
        session_id: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Generator[str, None, None]:
        """调用本地 GPU Ollama 大模型以纯流式 SSE 极速吐字，杜绝半句截断与圆括号泄漏"""
        self.cleanup_stopped_session(session_id)
        sess = session_manager.get_or_create(session_id)
        messages = self._build_llm_messages(query, history, sess, retrieved_chunks)

        meta_event = {
            "type": "meta",
            "intent": "local_gpu_llm_stream",
            "sources": sanitize_sources(retrieved_chunks),
            "provider": f"考亭理学书院 · 本地大模型 {self.ollama_model}",
            "session_id": session_id,
            "user_name": sess.get("user_name")
        }
        yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"

        payload = {
            "model": self.ollama_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": 0.75,
                "top_p": 0.9,
                "num_ctx": 4096,
                "num_predict": 1200,
                "repeat_penalty": 1.22,
                "repeat_last_n": 96,
                "presence_penalty": 0.35,
                "frequency_penalty": 0.45
            }
        }
        req = urllib.request.Request(
            f"{self.ollama_base_url}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )

        full_reply_parts = []
        seen_sentences = set()
        current_sentence_tokens = []
        current_sentence_text = ""
        stopped_early_due_to_loop = False
        in_paren = False
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                for line in resp:
                    if self.is_session_stopped(session_id):
                        print(f"[Ollama Stream] 会话 {session_id} 收到停止生成指令，立即中断输出")
                        break
                    if not line.strip():
                        continue
                    try:
                        chunk = json.loads(line.decode("utf-8"))
                        token = chunk.get("message", {}).get("content", "")
                        if not token:
                            continue

                        # 字符级拦截中英文圆括号，括号及其中文本彻底拦截丢弃（绝不向学者输出括号）
                        to_send_chars = []
                        for ch in token:
                            if ch in "（(":
                                in_paren = True
                            elif ch in "）)":
                                in_paren = False
                            elif in_paren:
                                pass
                            else:
                                to_send_chars.append(ch)

                        if not to_send_chars:
                            continue

                        safe_token = "".join(to_send_chars)

                        # 分句完整查重过滤与实时流式输出
                        aborted = False
                        for ch in safe_token:
                            current_sentence_tokens.append(ch)
                            current_sentence_text += ch
                            if ch in "。！？\n":
                                norm = current_sentence_text.strip()
                                if len(norm) >= 12:
                                    if norm in seen_sentences:
                                        print(f"[Ollama Stream] 触发分句防复读截断: {norm[:20]}...")
                                        stopped_early_due_to_loop = True
                                        current_sentence_tokens.pop()
                                        aborted = True
                                        break
                                    seen_sentences.add(norm)

                                # 将此分句完整刷新至输出流，严格执行第一人称净化
                                sentence_str = "".join(current_sentence_tokens)
                                sentence_str = sanitize_zhuxi_first_person(sentence_str)
                                full_reply_parts.append(sentence_str)
                                data_event = {"type": "token", "content": sentence_str}
                                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"
                                current_sentence_tokens = []
                                current_sentence_text = ""
                        if aborted:
                            break
                    except Exception:
                        continue

            # 刷新最后未以标点结束的有效分句，杜绝半截被截断
            if current_sentence_tokens and not self.is_session_stopped(session_id):
                rem = "".join(current_sentence_tokens)
                rem = sanitize_zhuxi_first_person(rem)
                if not rem.endswith(('。', '！', '？', '！', '”', '’')):
                    rem = rem.rstrip('，、； ') + "。"
                full_reply_parts.append(rem)
                data_event = {"type": "token", "content": rem}
                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"

            # 若因复读提前截断，输出自然收束标点
            if stopped_early_due_to_loop and not self.is_session_stopped(session_id):
                closing = "。"
                full_reply_parts.append(closing)
                data_event = {"type": "token", "content": closing}
                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"

            raw_full = "".join(full_reply_parts)

            # 检查启发式设问反思
            last_window = raw_full[-120:] if len(raw_full) >= 120 else raw_full
            if not any(q in last_window for q in ["？", "?"]) and not self.is_session_stopped(session_id):
                socratic_q = "\n\n老夫且掩卷设问以验贤生：仁兄体味此节要义，若落在汝自家日用身心之中，当从何处切己下手？"
                full_reply_parts.append(socratic_q)
                data_event = {"type": "token", "content": socratic_q}
                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"

            # 严格保障流式输出末尾必带有清晰的 CText 典籍与武夷学院特藏 OPAC 索书号标注
            raw_full = "".join(full_reply_parts)
            if not any(k in raw_full for k in ["典籍原典出处", "考亭典籍出处", "典籍出处", "出处："]) and not self.is_session_stopped(session_id):
                source_cite = format_citation(query, retrieved_chunks)
                full_reply_parts.append(source_cite)
                data_event = {"type": "token", "content": source_cite}
                yield f"data: {json.dumps(data_event, ensure_ascii=False)}\n\n"

            raw_full = "".join(full_reply_parts)
            cleaned_full = sanitize_zhuxi_first_person(raw_full)
            cleaned_full = strip_parentheses(cleaned_full)
            session_manager.update_with_reply(session_id, cleaned_full)
            yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
        except GeneratorExit:
            print(f"[Ollama Stream] 客户端主动断开/终止生成: {session_id}")
        finally:
            self.cleanup_stopped_session(session_id)

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
        # 3. 学术论文撰写、选题立论与课题咨询分支（面向本科生通识与研究生研学）
        # =========================================================================
        if any(k in q_lower for k in ["论文", "写论文", "做论文", "毕业论文", "开题", "做研究", "选题"]):
            return (
                f"{salutation}欲作理学学术论文，大展宏图，老夫深为嘉许！考亭理学博大精深，立论之要，首在‘先立乎其大者’。\n\n"
                "📜 **【考亭原典明训】**：\n"
                "> 《考亭语类》云：“大抵为学，须先有个规模，然后有所遵循。若规模未立，便漫然用功，亦不过为碎义逃难而已。”\n\n"
                "💡 **【现代研学选题与立论门径】**：\n"
                "结合本校闽北文库与朱子特藏资源，老夫建议仁兄可从以下四个学术前沿方向切入立论：\n"
                "一、四书章句系统与理学工夫之建构：考订《大学章句》格物补传与《中庸章句》之逻辑闭环；\n"
                "二、武夷精舍与九曲棹歌山水理趣考：探析老夫在隐屏峰下讲学期间‘即物穷理’与自然审美的哲学融通；\n"
                "三、五夫社仓救荒恤民制度与宋代社会经世实践：考察理学家‘义利双行’之经世致用与制度创新；\n"
                "四、鹅湖之会朱陆异同与知行学脉辨析：对比‘尊德性’与‘道问学’之工夫次第与现代启示。\n\n"
                "🎯 **【文献依据与进阶指引】**：\n"
                "仁兄可先至武夷学院逸夫图书馆六楼特藏专区调阅《四书章句集注》索书号 B244.7/X82 与《建宁府崇安县五夫社仓记》索书号 K825.4/X82，再辅以 CText 原典互校。\n\n"
                "老夫且设问以验贤生：仁兄当下志趣，是更倾向于理学纯哲学范畴之思辨，还是侧重于制度实务与经世致用之考察？"
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
                "> 《考亭语类》云：“学问之道无他，宽着期限，紧着日程。人一能之己百之，人十能之己千之。”\n\n"
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
                    "> 老夫在《考亭语类》中尝诫门人：“体倦则心怠，心怠则理不入。半日静坐，半日读书。读书不可贪多，宽着期限，紧着日程。”\n\n"
                    "💡 **【现代白话精析】**：\n"
                    "人的身体若已经疲累至极，心神自然懈怠涣散，此时强行捧书硬看，经书字句如同水浇鸭背，根本入不了心。老夫平生极重半日静坐、半日读书。所谓静坐，不是去参枯木死灰之禅，而是端正身躯、双目微闭、收敛心神，让纷扰的杂念沉淀下去。精神养足了，再拿出一小段文章从容细嚼，反而事半功倍！\n\n"
                    "🎯 **【切己体察功夫】**：\n"
                    "仁兄今日若是心烦意乱、学不进去，且先合上书卷，出门散步半刻，看一看草木生机，或饮一盏清茶歇息。待身心清凉宁定，再定下一小段功课。今日且与老夫闲聊几句，亦是一番调摄！"
                )
            else:
                return (
                    f"{salutation}且放宽心怀！人之心神正如琴弦，过张则易折，过弛则不鸣。\n\n"
                    "📜 **【考亭原典明训】**：\n"
                    "> 老夫在《考亭语类》中示门生：“为学须从容优游，不可急迫。心急则气浮，气浮则理不入。”\n\n"
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
                "> 老夫在《考亭语类》中谆谆戒曰：“以二书并观，则历落相瞒；以一书兼旬，则融液精明。小立课程，微加积叠。字求其训，句索其旨。未得乎前，不敢求乎后；未通乎上，不敢求乎下。”\n\n"
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
                "> 老夫在《考亭语类》中设千古绝喻：“理一分殊，本只是一太极，而万物各有其太极。如月在天，只一而已；及散在江湖，则随处而见，不可谓月已分也。”\n\n"
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
                "> 老夫在《考亭语类》中谆谆辨释曰：“饮食，天理也；要求山珍海味贪索无度，人欲也。衣以御寒，天理也；奢靡纨绔文绣，人欲也。革尽人欲，复还天理之全。”\n\n"
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
                "> 老夫在《考亭语类》中谆谆教诲门生：\n"
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
                "> 老夫在《考亭读书法》中立主宰之则：\n"
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
            c_src = selected_chunk['source'].replace('.txt', '').replace('.md', '').replace('《', '').replace('》', '')
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

        # 优先级 1：智谱清言 GLM 免费大模型
        if self.api_key:
            try:
                res = self._call_glm(query, history, session_id, retrieved_chunks)
                if res and res.get("reply"):
                    return res
            except Exception as e:
                print(f"[Agent] 智谱 GLM 同步响应遇阻，尝试备用通道: {e}")

        # 优先级 2：本地 GPU 大模型 (Ollama Qwen2.5) 极速智能化生成
        if self.check_ollama():
            try:
                res = self._call_ollama(query, history, session_id, retrieved_chunks)
                if res and res.get("reply"):
                    return res
            except Exception as e:
                print(f"[Agent] 本地 Ollama 响应遇阻，自动平滑切换至内生认知推理: {e}")

        # 优先级 3：考亭书院·内生认知推理自适应引擎（高保真离线保障）
        reply_text = self._generate_intelligent_response(query, session_id, retrieved_chunks)
        reply_text = sanitize_zhuxi_first_person(reply_text)
        reply_text = ensure_socratic_question(reply_text, query)
        if not any(k in reply_text for k in ["典籍原典出处", "考亭典籍出处", "典籍出处", "出处："]):
            reply_text += format_citation(query, retrieved_chunks)
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

        # 优先级 1：智谱清言 GLM 免费大模型流式输出
        if self.api_key:
            try:
                for chunk in self._call_glm_stream(query, history, session_id, retrieved_chunks):
                    yield chunk
                return
            except Exception as e:
                print(f"[Agent Stream] 智谱 GLM 流式生成遇阻，自动平滑切换至内生认知推理: {e}")

        # 优先级 2：优先使用本地 GPU Ollama 大模型以纯流式秒级吐字
        if not self.api_key and self.check_ollama():
            try:
                for chunk in self._call_ollama_stream(query, history, session_id, retrieved_chunks):
                    yield chunk
                return
            except Exception as e:
                print(f"[Agent Stream] 本地 Ollama 流式遇阻，启用平滑打字机推送: {e}")
                self._ollama_available = False
                self._last_ollama_check = time.time() + 5.0

        # 优先级 3：否则通过内生认知推理直接秒级生成，零卡顿平滑打字机推送
        reply_text = self._generate_intelligent_response(query, session_id, retrieved_chunks)
        reply_text = sanitize_zhuxi_first_person(reply_text)
        reply_text = ensure_socratic_question(reply_text, query)
        if not any(k in reply_text for k in ["典籍原典出处", "考亭典籍出处", "典籍出处", "出处："]):
            reply_text += format_citation(query, retrieved_chunks)
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
            print(f"[Agent Stream] 客户端断开连接 (GeneratorExit): {session_id}")
        finally:
            self.cleanup_stopped_session(session_id)


zhuzi_agent = ZhuXiAgent()

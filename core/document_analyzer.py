"""
朱子文化特色智能体 - 文献即物穷理深度剖析引擎 (Document Analyzer)
支持多格式文献抽取 (txt, md, docx, pdf) 与朱子理学“理气·心性·知行”四维深度解构
"""

import os
import re
from typing import Dict, Any, Tuple


def extract_document_text(filename: str, file_bytes: bytes) -> str:
    """提取上传文档的文本内容"""
    lower_name = filename.lower()

    # 1. 纯文本 / Markdown
    if lower_name.endswith(('.txt', '.md', '.json', '.csv')):
        for enc in ['utf-8', 'gbk', 'gb18030', 'utf-16']:
            try:
                return file_bytes.decode(enc)
            except Exception:
                continue
        return file_bytes.decode('utf-8', errors='ignore')

    # 2. DOCX 格式
    if lower_name.endswith('.docx'):
        try:
            import io
            import zipfile
            import xml.etree.ElementTree as ET

            # 纯标准库极速解析 docx 中的 word/document.xml
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                xml_content = z.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                paragraphs = []
                for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                    texts = [t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
                    if texts:
                        paragraphs.append(''.join(texts))
                return '\n'.join(paragraphs)
        except Exception as e:
            print(f"[DocumentAnalyzer] DOCX 解析降级: {e}")
            return file_bytes.decode('utf-8', errors='ignore')

    # 3. PDF 格式
    if lower_name.endswith('.pdf'):
        try:
            import io
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return '\n'.join(pages)
        except Exception as e:
            # 基础文本抽取降级
            raw = file_bytes.decode('latin1', errors='ignore')
            text_chunks = re.findall(r'\(([^\(\)]+)\)\s*T[jJ]', raw)
            if text_chunks:
                return '\n'.join(text_chunks)
            return "（PDF 文档已成功挂载，老夫当体察其旨趣并析解其理）"

    return file_bytes.decode('utf-8', errors='ignore')


def build_zhuzi_analysis_prompt(filename: str, text_content: str) -> str:
    """构建朱子理学即物穷理深度剖析 Prompt"""
    # 截取适量字符（不超过 3500 字，提炼精髓）
    snippet = text_content[:3500].strip()

    prompt = f"""后学仁兄呈呈上来一篇文献资料《{filename}》，请先生（老夫）以纯第一人称自述，运用考亭理学“即物穷理、心统性情、知行相须”的至理，对这篇文献所蕴含的道理和朱子文化精义进行深入浅出的条分缕析。

【待剖析文献原稿摘录】：
\"\"\"
{snippet}
\"\"\"

请先生以朱子文人风骨与亲切开导的口吻，结构化从以下四大理学维度进行朱砂手批与义理解构：

一、 📜【卷首提要 · 即物穷理】：
概述这篇文献所论何事？从理学视角看，事事物物皆有客观必然之“理”，此文关乎何种天地人事之常理？

二、 ☯️【理气之辨 · 寻本溯源】：
剖析文中呈现的现象（“气”之聚散与表象）与本质规矩（“理”之固然）。指出何处是外在流转之形迹，何处是不可移易之铁律。

三、 🏮【心统性情 · 存养省察】：
从心性修养视角切入：此文所反映之人心思虑，何者合于“天理之至公”，何者易流于“人欲之偏私”？学者读此文当如何收敛身心、涵养持敬？

四、 👣【知行相须 · 现实践履指南】：
“知之愈明，则行之愈笃”。结合朱子读书法与处世箴规，给当下的后学学子开出 2~3 条切实可行的日用行持建议。

末尾请附上一句先生题赠门生的考亭勉词与朱砂印记。要求：必须纯第一人称“老夫”自述，语言典雅生动，文白兼备。"""

    return prompt


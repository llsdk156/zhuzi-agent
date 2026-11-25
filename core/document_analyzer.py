"""
朱子文化特色智能体 - 文献即物穷理深度剖析引擎 (Document Analyzer)
支持多格式文献抽取 (txt, md, docx, pdf) 与朱子理学“理气·心性·知行”四维深度解构
"""

import io
import re
import zipfile
import xml.etree.ElementTree as ET


def extract_document_text(filename: str, file_bytes: bytes) -> str:
    """安全、可靠地提取上传文档的文本内容（无法提取时返回空字符串，绝不伪造内容）"""
    lower_name = (filename or "").lower()

    # 1. 纯文本 / Markdown
    if lower_name.endswith(('.txt', '.md', '.json', '.csv')):
        for enc in ('utf-8', 'utf-8-sig', 'gb18030', 'gbk', 'utf-16'):
            try:
                return file_bytes.decode(enc)
            except Exception:
                continue
        return file_bytes.decode('utf-8', errors='ignore')

    # 2. DOCX 格式（按段落 <w:p> 拼接 <w:t>，保留句子完整性）
    if lower_name.endswith('.docx'):
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                xml_content = z.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
                paragraphs = []
                for p in tree.iter(f'{ns}p'):
                    texts = [t.text for t in p.iter(f'{ns}t') if t.text]
                    if texts:
                        paragraphs.append(''.join(texts))
                return '\n'.join(paragraphs)
        except Exception as e:
            print(f"[DocumentAnalyzer] DOCX 解析失败: {e}")
            return ""

    # 3. PDF 格式（优先使用 pypdf 完整解压与解析文本层）
    if lower_name.endswith('.pdf'):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages = []
            for page in reader.pages[:40]:  # 上限 40 页避免超大 PDF 阻塞
                text = page.extract_text()
                if text and text.strip():
                    pages.append(text.strip())
            if pages:
                return '\n\n'.join(pages)
        except Exception as e:
            print(f"[DocumentAnalyzer] pypdf 解析异常: {e}")

        # 降级尝试：正确方向的 PDF 文本算子 (text) Tj 提取（仅对未压缩 PDF 有效）
        try:
            raw = file_bytes.decode('latin1', errors='ignore')
            text_chunks = re.findall(r'\(([^\(\)\\]{2,})\)\s*T[jJ]', raw)
            cleaned = [c.strip() for c in text_chunks if re.search(r'[\u4e00-\u9fffA-Za-z0-9]', c)]
            if cleaned:
                return '\n'.join(cleaned)
        except Exception:
            pass
        return ""

    return ""

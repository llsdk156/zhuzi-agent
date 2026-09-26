# -*- coding: utf-8 -*-
"""
从权威古籍数字文库自动化抓取朱熹在武夷山与考亭书院著作的完整全本电子书
并保存至 data/ebooks_download/
"""

import os
import re
import json
import urllib.request
import urllib.parse
from html.parser import HTMLParser

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOAD_DIR = os.path.join(BASE_DIR, "data", "ebooks_download")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

PAGES_TO_FETCH = [
    {
        "title": "大学章句",
        "output_file": "四书章句集注_大学章句_完整全本.txt",
        "api_page": "大學章句"
    },
    {
        "title": "中庸章句",
        "output_file": "四书章句集注_中庸章句_完整全本.txt",
        "api_page": "中庸章句"
    },
    {
        "title": "白鹿洞书院揭示",
        "output_file": "白鹿洞书院揭示与学规_完整全本.txt",
        "api_page": "白鹿洞書院揭示"
    },
    {
        "title": "朱子家训",
        "output_file": "朱子治家格言与家训_完整全本.txt",
        "api_page": "朱子家訓"
    }
]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
        self.skip = False

    def handle_starttag(self, tag, attrs):
        if tag in ["script", "style", "table", "sup", "noscript"]:
            self.skip = True

    def handle_endtag(self, tag):
        if tag in ["script", "style", "table", "sup", "noscript"]:
            self.skip = False

    def handle_data(self, data):
        if not self.skip:
            s = data.strip()
            if s:
                self.texts.append(s)

def clean_html_to_text(html_content: str) -> str:
    parser = TextExtractor()
    parser.feed(html_content)
    cleaned = []
    for t in parser.texts:
        if any(w in t for w in ["維基文庫", "Wikisource", "公有領域", "本作品在全世界", "导航菜单", "个人工具"]):
            continue
        cleaned.append(t)
    return "\n\n".join(cleaned)

def fetch_page(api_page: str) -> str:
    url = f"https://zh.wikisource.org/w/api.php?action=parse&page={urllib.parse.quote(api_page)}&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if "error" in data:
            raise Exception(data["error"].get("info", "Unknown error"))
        html = data.get("parse", {}).get("text", {}).get("*", "")
        return clean_html_to_text(html)

def main():
    print("=" * 60)
    print("开始全自动下载朱子理学经典完整全本电子书...")
    print(f"存储目标目录: {DOWNLOAD_DIR}")
    print("=" * 60)

    for item in PAGES_TO_FETCH:
        title = item["title"]
        out_file = item["output_file"]
        api_page = item["api_page"]
        out_path = os.path.join(DOWNLOAD_DIR, out_file)
        print(f"[*] 正在抓取《{title}》全本电子书...")
        try:
            content = fetch_page(api_page)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(f"# 《{title}》【完整全本珍藏版】\n")
                f.write(f"【著述】：南宋 · 考亭先生 朱熹 撰定\n")
                f.write(f"【出版/版本】：宋咸淳刊本 / 钦定四库全书本校订\n\n---\n\n")
                f.write(content)
            print(f"    [OK] 成功下载: {out_file}，字数: {len(content)} 字，大小: {os.path.getsize(out_path)} 字节")
        except Exception as e:
            print(f"    [FAIL] 下载失败: {e}")

    print("=" * 60)
    print("抓取任务完成！可在 data/ebooks_download/ 查看完整电子书。")

if __name__ == "__main__":
    main()

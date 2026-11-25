# -*- coding: utf-8 -*-
"""
武夷学院图书馆 OPAC 新一代智慧系统 (Space v4.2.29) 对接服务模块
支持实时在馆/借阅状态查询、索书号与馆藏定位、直达详情页跳转、线下预约书单管理
"""

import os
import re
import json
import time
import ssl
import random
import threading
import tempfile
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "opac_books_db.json")
RESERVATIONS_PATH = os.path.join(BASE_DIR, "data", "opac_reservations.json")
OPAC_API_URL = "https://wyutsg.wuyiu.edu.cn/meta-local/opac/search/"

# 允许忽略学校自签证书校验警告（可通过环境变量 OPAC_SSL_VERIFY=1 开启严格校验）
SSL_CTX = ssl.create_default_context()
if os.getenv("OPAC_SSL_VERIFY", "0") != "1":
    SSL_CTX.check_hostname = False
    SSL_CTX.verify_mode = ssl.CERT_NONE


def mask_phone(phone: str) -> str:
    """对手机号进行脱敏处理，避免明文泄露读者隐私"""
    p = (phone or "").strip()
    if len(p) >= 7:
        return f"{p[:3]}****{p[-4:]}"
    return "****" if p else ""


def _parse_holdings(holdings_raw: Any) -> List[Dict[str, Any]]:
    if isinstance(holdings_raw, list):
        return [h for h in holdings_raw if isinstance(h, dict)]
    if isinstance(holdings_raw, str):
        try:
            parsed = json.loads(holdings_raw)
            if isinstance(parsed, list):
                return [h for h in parsed if isinstance(h, dict)]
        except Exception:
            pass
    return []


class OPACService:
    def __init__(self):
        self._books_cache: Dict[str, Dict[str, Any]] = {}
        self._live_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 300  # 实时状态缓存 5 分钟
        self._max_cache_size = 256
        self._lock = threading.Lock()
        self.load_local_db()

    def load_local_db(self):
        """加载本地固化的武夷学院真实馆藏数据库"""
        if os.path.exists(DB_PATH):
            try:
                with open(DB_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                # 防御性清洗可能残留的字符串型 holdings
                for _, rec in data.items():
                    if isinstance(rec, dict) and isinstance(rec.get("holdings"), str):
                        rec["holdings"] = _parse_holdings(rec["holdings"])
                self._books_cache = data
            except Exception as e:
                print(f"[OPAC] 读取本地书目库异常: {e}")
                self._books_cache = {}

    def get_all_books(self) -> Dict[str, Dict[str, Any]]:
        if not self._books_cache:
            self.load_local_db()
        return self._books_cache

    def match_book(self, text: str) -> Optional[Dict[str, Any]]:
        """从用户查询、出处标题中智能匹配对应的典籍条目"""
        if not text:
            return None
        t_clean = re.sub(r'[《》【】·\s]', '', text).lower()

        # 1. 尝试直接 key 匹配
        if t_clean in self._books_cache:
            return self._books_cache[t_clean]

        # 2. 精确标题匹配
        for k, b in self._books_cache.items():
            b_std = re.sub(r'[《》【】·\s]', '', b.get("stdTitle", "")).lower()
            b_opac = re.sub(r'[《》【】·\s]', '', b.get("opacTitle", "")).lower()
            if b_std and (b_std in t_clean or t_clean in b_std):
                return b
            if b_opac and (b_opac in t_clean or t_clean in b_opac):
                return b

        # 3. 别名关键词映射（具体书名优先于泛词）
        alias_map = [
            ("诗集传", "shijizhuan"),
            ("诗经", "shijizhuan"),
            ("诗和远方", "wuyi_shici"),
            ("政和", "wuyi_zhenghe"),
            ("朱子三代", "wuyi_zhenghe"),
            ("福建朱子学", "wuyi_fujian"),
            ("世纪之交", "wuyi_century"),
            ("考亭论坛", "wuyi_kaoting"),
            ("朝圣朱子", "wuyi_chaosheng"),
            ("海外", "wuyi_haiwai"),
            ("武夷精舍", "wuyi_dongjing"),
            ("文集", "huian"),
            ("晦庵", "huian"),
            ("大学", "daxue"),
            ("中庸", "zhongyong"),
            ("论语", "lunyu"),
            ("孟子", "mengzi"),
            ("四书", "sishu"),
            ("语类", "yulei"),
            ("近思录", "jinsi"),
            ("太极图", "taiji"),
            ("西铭", "ximing"),
            ("通鉴纲目", "gangmu"),
            ("纲目", "gangmu"),
            ("周易本义", "zhouyi"),
            ("周易", "zhouyi"),
            ("楚辞", "chuci"),
            ("童蒙须知", "tongmeng"),
            ("童蒙", "tongmeng"),
            ("白鹿洞", "xuegui"),
            ("学规", "xuegui"),
        ]
        for kw, book_key in alias_map:
            if kw in t_clean and book_key in self._books_cache:
                return self._books_cache[book_key]

        return None

    def query_opac_api(self, keyword: str, field: str = "all", page: int = 1, size: int = 5) -> List[Dict[str, Any]]:
        """直接调用武夷学院 OPAC API 执行实时检索"""
        payload = {
            "page": page,
            "pageSize": size,
            "indexName": "idx.opac",
            "sortField": "relevance",
            "sortType": "desc",
            "collapseField": "groupId",
            "queryFieldList": [{"logic": 0, "field": field, "values": [keyword], "operator": "*"}],
            "filterFieldList": []
        }
        req = urllib.request.Request(
            OPAC_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=6, context=SSL_CTX) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("data", {}).get("dataList", [])
        except Exception as e:
            print(f"[OPAC API] 检索 '{keyword}' 异常: {e}")
            return []

    def _evict_cache_if_needed(self, now: float):
        expired = [k for k, v in self._live_cache.items() if now - v["timestamp"] >= self._cache_ttl]
        for k in expired:
            self._live_cache.pop(k, None)
        while len(self._live_cache) >= self._max_cache_size:
            oldest = next(iter(self._live_cache))
            self._live_cache.pop(oldest, None)

    def get_live_book_status(self, book_key_or_name: str, force: bool = False) -> Dict[str, Any]:
        """获取典籍的实时借阅与在馆状态（带本地缓存与高可靠兜底）"""
        matched = self.match_book(book_key_or_name)
        now = time.time()

        cache_key = matched["id"] if matched else book_key_or_name.strip()
        if not force and cache_key in self._live_cache:
            cache_entry = self._live_cache[cache_key]
            if now - cache_entry["timestamp"] < self._cache_ttl:
                return cache_entry["data"]

        search_kw = matched["opacTitle"] if matched else book_key_or_name
        items = self.query_opac_api(search_kw, size=2)

        if items:
            best = items[0]
            holdings = _parse_holdings(best.get("holdings", []))

            avail_count = sum(1 for h in holdings if h.get("status") == "可借")
            reading_count = sum(1 for h in holdings if h.get("status") == "阅览")
            total_count = len(holdings)

            if avail_count > 0:
                status_text = "可借"
                is_borrowable = True
                in_library_only = False
                extra = f" / 馆内特藏阅览 {reading_count} 册" if reading_count > 0 else ""
                copies_desc = f"纸本馆藏 {total_count} 册 / 实时在架可借 {avail_count} 册{extra}"
            elif reading_count > 0:
                status_text = "馆内阅览"
                is_borrowable = False
                in_library_only = True
                copies_desc = f"纸本馆藏 {total_count} 册 / 馆内特藏阅览 {reading_count} 册（不可外借）"
            elif total_count > 0:
                status_text = "借出"
                is_borrowable = False
                in_library_only = False
                copies_desc = f"纸本馆藏 {total_count} 册 / 当前全部借出（可预约）"
            else:
                status_text = matched["status"] if matched else "馆内阅览"
                is_borrowable = matched["isBorrowable"] if matched else False
                in_library_only = matched.get("inLibraryOnly", not is_borrowable) if matched else True
                copies_desc = matched.get("copiesDesc", "以 OPAC 实时馆藏为准") if matched else "以 OPAC 实时馆藏为准"

            raw_callno = best.get("callno")
            if isinstance(raw_callno, list) and raw_callno:
                call_no = str(raw_callno[0])
            elif isinstance(raw_callno, str) and raw_callno.strip():
                call_no = raw_callno.strip()
            elif holdings and holdings[0].get("callNo"):
                call_no = holdings[0]["callNo"]
            else:
                call_no = matched["callNumber"] if matched else ""

            location = (
                next((h.get("location") for h in holdings if h.get("status") == "可借" and h.get("location")), None)
                or (holdings[0].get("location") if holdings else None)
                or (matched["location"] if matched else "武夷学院逸夫图书馆")
            )
            bib_id = best.get("bibId", "") or (matched.get("bibId", "") if matched else "")

            raw_pub = best.get("publisher", "")
            publisher = raw_pub[0] if isinstance(raw_pub, list) and raw_pub else (raw_pub if isinstance(raw_pub, str) else "")
            if not publisher and matched:
                publisher = matched.get("publisher", "")

            result_data = {
                "found": True,
                "bookId": matched["id"] if matched else "",
                "title": matched["stdTitle"] if matched else best.get("title", book_key_or_name),
                "opacTitle": best.get("title", search_kw),
                "bibId": bib_id,
                "callNumber": call_no,
                "location": location,
                "status": status_text,
                "isBorrowable": is_borrowable,
                "inLibraryOnly": in_library_only,
                "totalCopies": total_count or (matched["totalCopies"] if matched else 0),
                "availableCopies": avail_count if total_count > 0 else (matched["availableCopies"] if matched else 0),
                "copiesDesc": copies_desc,
                "detailUrl": f"https://wyutsg.wuyiu.edu.cn/space/searchDetailLocal/{bib_id}" if bib_id else "https://wyutsg.wuyiu.edu.cn/space/index",
                "isbn": best.get("isbn", "") or (matched.get("isbn", "") if matched else ""),
                "publisher": publisher,
                "pubYear": best.get("pub_year", "") or (matched.get("pubYear", "") if matched else "")
            }
        elif matched:
            result_data = {
                "found": True,
                "bookId": matched["id"],
                "title": matched["stdTitle"],
                "opacTitle": matched["opacTitle"],
                "bibId": matched.get("bibId", ""),
                "callNumber": matched["callNumber"],
                "location": matched["location"],
                "status": matched["status"],
                "isBorrowable": matched["isBorrowable"],
                "inLibraryOnly": matched.get("inLibraryOnly", matched["status"] == "馆内阅览"),
                "totalCopies": matched["totalCopies"],
                "availableCopies": matched["availableCopies"],
                "copiesDesc": matched["copiesDesc"],
                "detailUrl": matched["detailUrl"],
                "isbn": matched.get("isbn", ""),
                "publisher": matched.get("publisher", ""),
                "pubYear": matched.get("pubYear", "")
            }
        else:
            # 查无馆藏时诚实返回，不伪造索书号与在架状态
            result_data = {
                "found": False,
                "bookId": "",
                "title": book_key_or_name,
                "opacTitle": book_key_or_name,
                "bibId": "",
                "callNumber": "",
                "location": "暂未查得馆藏排架信息",
                "status": "未查得馆藏",
                "isBorrowable": False,
                "inLibraryOnly": False,
                "totalCopies": 0,
                "availableCopies": 0,
                "copiesDesc": "暂未在馆藏书目中检索到此书，可前往 OPAC 检索确认",
                "detailUrl": "https://wyutsg.wuyiu.edu.cn/space/index",
                "isbn": "",
                "publisher": "",
                "pubYear": ""
            }

        self._evict_cache_if_needed(now)
        self._live_cache[cache_key] = {
            "timestamp": now,
            "data": result_data
        }
        return result_data

    # ========================================================
    # 线下预约借阅单存储与管理（线程安全 + 原子写入 + 隐私脱敏）
    # ========================================================
    def _read_reservations_unlocked(self) -> List[Dict[str, Any]]:
        if os.path.exists(RESERVATIONS_PATH):
            try:
                with open(RESERVATIONS_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data if isinstance(data, list) else []
            except Exception as e:
                print(f"[OPAC] 读取预约记录异常: {e}")
        return []

    def _write_reservations_unlocked(self, records: List[Dict[str, Any]]):
        dir_name = os.path.dirname(RESERVATIONS_PATH)
        os.makedirs(dir_name, exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(prefix="opac_res_", suffix=".json", dir=dir_name)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(records, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, RESERVATIONS_PATH)
        except Exception as e:
            print(f"[OPAC] 保存预约记录异常: {e}")
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

    def load_reservations(self, card_id: Optional[str] = None, mask_sensitive: bool = True) -> List[Dict[str, Any]]:
        with self._lock:
            records = self._read_reservations_unlocked()

        if card_id:
            cid = str(card_id).strip()
            records = [
                r for r in records
                if str(r.get("readerId") or r.get("card_id") or "").strip() == cid
            ]

        if mask_sensitive:
            safe_records = []
            for r in records:
                item = dict(r)
                if item.get("phone"):
                    item["phone"] = mask_phone(str(item["phone"]))
                safe_records.append(item)
            return safe_records
        return records

    def create_reservation(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """创建一条线下借阅预约申请"""
        random_suffix = random.randint(1000, 9999)
        res_code = f"WYU-OPAC-{time.strftime('%Y%m%d')}-{random_suffix}"

        reader_name = str(payload.get("readerName") or payload.get("reader_name") or "问学读者").strip()
        reader_id = str(payload.get("readerId") or payload.get("card_id") or "").strip()
        phone = str(payload.get("phone") or "").strip()
        reader_type = str(payload.get("readerType") or payload.get("reader_type") or "本科生").strip()
        pickup_date = str(payload.get("pickupDate") or payload.get("pickup_date") or time.strftime("%Y-%m-%d")).strip()
        pickup_loc = str(payload.get("pickupLocation") or payload.get("pickup_location") or "逸夫图书馆六楼特藏专区服务台").strip()
        notes = str(payload.get("notes") or "请携带校园卡或有效凭证至所选服务台核验领书。").strip()

        record = {
            "reservationId": res_code,
            "createdAt": time.strftime("%Y-%m-%d %H:%M:%S"),
            "readerName": reader_name,
            "readerId": reader_id,
            "card_id": reader_id,
            "phone": phone,
            "readerType": reader_type,
            "pickupDate": pickup_date,
            "pickupLocation": pickup_loc,
            "books": payload.get("books") or [],
            "status": "预约成功·待到馆取书",
            "notes": notes
        }

        with self._lock:
            reservations = self._read_reservations_unlocked()
            reservations.insert(0, record)
            self._write_reservations_unlocked(reservations)

        safe_record = dict(record)
        safe_record["phone"] = mask_phone(phone)
        return safe_record

    def cancel_reservation(self, res_id: str, card_id: Optional[str] = None) -> Dict[str, Any]:
        """取消一条线下借阅预约申请，释放馆藏架位"""
        target_id = (res_id or "").strip()
        if not target_id:
            return {"success": False, "message": "预约单号不可为空"}

        with self._lock:
            reservations = self._read_reservations_unlocked()
            found = False
            for r in reservations:
                rid = str(r.get("reservationId") or r.get("reservation_id") or "").strip()
                if rid == target_id:
                    if card_id:
                        owner_id = str(r.get("readerId") or r.get("card_id") or "").strip()
                        if owner_id and owner_id != card_id.strip():
                            return {"success": False, "message": "读者证号与预约单不匹配，无权取消"}
                    r["status"] = "已取消预约"
                    r["cancelledAt"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    found = True
                    break

            if found:
                self._write_reservations_unlocked(reservations)
                return {"success": True, "message": f"预约单【{target_id}】已成功取消，特藏架位已实时释放"}
            return {"success": False, "message": f"未找到预约单号【{target_id}】"}

    def get_known_accounts(self) -> List[Dict[str, Any]]:
        """获取历史上提交过预约的读者账号列表（脱敏）"""
        all_res = self.load_reservations(mask_sensitive=True)
        accounts_map = {}
        for r in all_res:
            cid = str(r.get("readerId") or r.get("card_id") or "").strip()
            if not cid:
                continue
            if cid not in accounts_map:
                accounts_map[cid] = {
                    "cardId": cid,
                    "readerName": r.get("readerName") or r.get("reader_name") or "读者",
                    "phone": r.get("phone") or "",
                    "readerType": r.get("readerType") or r.get("reader_type") or "本科生",
                    "totalReservations": 0,
                    "activeReservations": 0,
                    "lastActive": r.get("createdAt") or ""
                }
            accounts_map[cid]["totalReservations"] += 1
            if r.get("status") not in ["cancelled", "已取消预约"]:
                accounts_map[cid]["activeReservations"] += 1
        return list(accounts_map.values())


opac_service = OPACService()

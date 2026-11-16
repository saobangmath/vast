"""Heuristic filter to keep science/tech stories and drop off-topic politics."""

from __future__ import annotations

import re
import unicodedata

TECH_TERMS = [
    "khoa học",
    "công nghệ",
    "nghiên cứu",
    "trí tuệ nhân tạo",
    "robot",
    "bán dẫn",
    "chip",
    "vũ trụ",
    "vệ tinh",
    "spacex",
    "nasa",
    "tên lửa",
    "sinh học",
    "vaccine",
    "vắc xin",
    "vật lý",
    "hóa học",
    "toán học",
    "khí hậu",
    "môi trường",
    "năng lượng",
    "điện hạt nhân",
    "phần mềm",
    "phần cứng",
    "smartphone",
    "iphone",
    "android",
    "internet",
    "dữ liệu",
    "chuyển đổi số",
    "số hóa",
    "máy tính",
    "an ninh mạng",
    "startup",
    "công nghệ thông tin",
    "ict",
    "vinfuture",
    "phát minh",
    "sáng chế",
    "phòng thí nghiệm",
    "thiên văn",
    "địa chất",
    "đại dương",
    "biển sâu",
    "tế bào",
    "protein",
    "lượng tử",
    "quantum",
    "nvidia",
    "openai",
    "microsoft",
    "samsung",
    "blockchain",
    "ô nhiễm",
    "bảo tồn",
]

POLITICS_TERMS = [
    "tổng bí thư",
    "chủ tịch nước",
    "thủ tướng",
    "phó thủ tướng",
    "quốc hội",
    "bộ chính trị",
    "đảng ủy",
    "ngoại giao",
    "hội nghị cấp cao",
    "tiếp đón",
    "phát biểu tại phiên",
    "đại đoàn kết",
    "bầu cử",
    "nghị quyết",
]

STEM_RE = re.compile(
    r"\b(ai|gpu|cpu|nasa|spacex|iphone|android|robot|satellite|climate|genome|quantum|oled|5g|6g|iot)\b",
    re.IGNORECASE,
)


def _fold(text: str) -> str:
    text = unicodedata.normalize("NFC", text.lower())
    return f" {text} "


def is_science_tech(title: str, summary: str = "") -> bool:
    """Return True when the item looks like science/tech coverage."""
    blob = _fold(f"{title} {summary}")
    tech_hits = sum(1 for term in TECH_TERMS if term in blob)
    politics_hits = sum(1 for term in POLITICS_TERMS if term in blob)

    if politics_hits >= 1 and tech_hits == 0:
        return False
    if politics_hits >= 2 and tech_hits < 2:
        return False
    if tech_hits >= 1:
        return True
    return bool(STEM_RE.search(blob))

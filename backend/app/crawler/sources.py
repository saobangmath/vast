"""Allowlisted external Vietnamese science/tech sources (v1).

VAST is the host site for this feature, so it is intentionally not crawled.
Official VAST CMS content can be joined later via a separate publisher path.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class SourceConfig:
    key: str
    name: str
    homepage_url: str
    feed_url: str | None
    is_official: bool = False
    default_topic: str | None = None


# External press only — RSS-first allowlist.
# Notes:
# - VietnamPlus category RSS currently returns general politics → excluded
# - BaoMoi cong-nghe RSS is 404 → excluded
ALLOWLIST: list[SourceConfig] = [
    SourceConfig(
        key="vnexpress-khoahoc",
        name="VnExpress Khoa học",
        homepage_url="https://vnexpress.net/khoa-hoc",
        feed_url="https://vnexpress.net/rss/khoa-hoc.rss",
        default_topic="khoa-hoc",
    ),
    SourceConfig(
        key="tuoitre-khoahoc",
        name="Tuổi Trẻ Khoa học",
        homepage_url="https://tuoitre.vn/khoa-hoc.htm",
        feed_url="https://tuoitre.vn/rss/khoa-hoc.rss",
        default_topic="khoa-hoc",
    ),
    SourceConfig(
        key="thanhnien-congnghe",
        name="Thanh Niên Công nghệ",
        homepage_url="https://thanhnien.vn/cong-nghe.htm",
        feed_url="https://thanhnien.vn/rss/cong-nghe.rss",
        default_topic="cong-nghe",
    ),
    SourceConfig(
        key="vietnamnet-khoahoc",
        name="VietnamNet Khoa học",
        homepage_url="https://vietnamnet.vn/khoa-hoc",
        feed_url="https://vietnamnet.vn/rss/khoa-hoc.rss",
        default_topic="khoa-hoc",
    ),
    SourceConfig(
        key="genk-ict",
        name="Genk ICT",
        homepage_url="https://genk.vn/tin-ict.chn",
        feed_url="https://genk.vn/rss/tin-ict.rss",
        default_topic="cong-nghe",
    ),
]

TOPICS = [
    {
        "slug": "cong-nghe",
        "name": "Công nghệ",
        "description": "AI, bán dẫn, chuyển đổi số và công nghệ ứng dụng",
    },
    {
        "slug": "khoa-hoc",
        "name": "Khoa học",
        "description": "Nghiên cứu cơ bản, vật lý, hóa học, sinh học",
    },
    {
        "slug": "bien-moi-truong",
        "name": "Biển & Môi trường",
        "description": "Khoa học biển, khí hậu, bảo tồn",
    },
    {
        "slug": "dao-tao",
        "name": "Đào tạo",
        "description": "Học bổng, bồi dưỡng và nhân lực KHCN",
    },
]

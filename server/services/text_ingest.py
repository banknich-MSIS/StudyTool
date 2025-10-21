from __future__ import annotations

import re
from typing import List


def split_sentences(text: str) -> List[str]:
    text = text.replace("\r\n", "\n").strip()
    # Simple sentence split; good enough for initial local build
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]



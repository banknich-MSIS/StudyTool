from __future__ import annotations

from typing import Dict, List, Tuple

import pandas as pd


def normalize_csv(df: pd.DataFrame) -> Tuple[List[Dict], List[str]]:
    """Normalize a CSV into internal question dicts.

    Returns: (questions, warnings)
    """
    required_cols = {"question", "answer"}
    missing = required_cols - set(c.lower() for c in df.columns)
    warnings: List[str] = []
    if missing:
        warnings.append(f"Missing columns: {', '.join(sorted(missing))}")

    # Normalize columns to lowercase keys
    lower_map = {c: c.lower() for c in df.columns}
    work = df.rename(columns=lower_map)

    results: List[Dict] = []
    for _, row in work.iterrows():
        stem = str(row.get("question", "")).strip()
        qtype = str(row.get("type", "")).strip().lower()
        options_raw = row.get("options")
        answer_raw = row.get("answer")
        concepts_raw = row.get("concepts")

        options_list: List[str] | None = None
        if isinstance(options_raw, str) and options_raw.strip():
            options_list = [o.strip() for o in options_raw.split("|") if o.strip()]

        if not qtype:
            qtype = "mcq" if options_list else "short"

        # Parse answer
        if qtype == "multi":
            answer_value = [a.strip() for a in str(answer_raw).split("|") if a.strip()]
        elif qtype == "truefalse":
            answer_value = str(answer_raw).strip().lower() in ("true", "t", "1", "yes")
        else:
            answer_value = str(answer_raw).strip()

        concepts = []
        if isinstance(concepts_raw, str) and concepts_raw.strip():
            concepts = [c.strip() for c in concepts_raw.split(",") if c.strip()]

        results.append(
            {
                "stem": stem,
                "qtype": qtype,
                "options": {"list": options_list} if options_list else None,
                "answer": {"value": answer_value},
                "concepts": concepts,
            }
        )

    return results, warnings



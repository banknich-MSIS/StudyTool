from __future__ import annotations

from typing import Dict, List, Tuple

import pandas as pd


def normalize_csv(df: pd.DataFrame) -> Tuple[List[Dict], List[str], Dict]:
    """Normalize a CSV into internal question dicts.

    Returns: (questions, warnings, metadata)
    """
    required_cols = {"question", "answer"}
    missing = required_cols - set(c.lower() for c in df.columns)
    warnings: List[str] = []
    if missing:
        warnings.append(f"Missing columns: {', '.join(sorted(missing))}")

    # Extract metadata from CSV content
    metadata = {}
    
    # Look for metadata in the raw CSV content
    # Check if there are any rows that start with # or contain _metadata
    metadata_rows = []
    question_rows = []
    
    for idx, row in df.iterrows():
        # Check if this row contains metadata
        if any(str(val).startswith('#') for val in row.values if pd.notna(val)):
            metadata_rows.append(idx)
        elif any(str(val).startswith('_metadata') for val in row.values if pd.notna(val)):
            metadata_rows.append(idx)
        else:
            question_rows.append(idx)
    
    # Extract metadata from special rows
    for idx in metadata_rows:
        row = df.iloc[idx]
        for col, val in row.items():
            if pd.notna(val):
                val_str = str(val).strip()
                if val_str.startswith('#') and ':' in val_str:
                    # Format: #key: value
                    key, value = val_str[1:].split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == 'themes':
                        metadata['themes'] = [t.strip() for t in value.split(',') if t.strip()]
                    elif key == 'suggested_types':
                        metadata['suggested_types'] = [t.strip() for t in value.split(',') if t.strip()]
                    elif key == 'difficulty':
                        metadata['difficulty'] = value
                    elif key == 'recommended_count':
                        try:
                            metadata['recommended_count'] = int(value)
                        except ValueError:
                            warnings.append(f"Invalid recommended_count: {value}")
                elif val_str.startswith('_metadata'):
                    # Format: _metadata,key,value
                    parts = val_str.split(',')
                    if len(parts) >= 3:
                        key = parts[1].strip()
                        value = parts[2].strip()
                        
                        if key == 'themes':
                            metadata['themes'] = [t.strip() for t in value.split('|') if t.strip()]
                        elif key == 'suggested_types':
                            metadata['suggested_types'] = [t.strip() for t in value.split('|') if t.strip()]
                        elif key == 'recommended_count':
                            try:
                                metadata['recommended_count'] = int(value)
                            except ValueError:
                                warnings.append(f"Invalid recommended_count: {value}")

    # Filter out metadata rows from question processing
    if metadata_rows:
        df = df.drop(metadata_rows).reset_index(drop=True)

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

    return results, warnings, metadata



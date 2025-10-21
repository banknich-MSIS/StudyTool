from __future__ import annotations

from typing import List, Tuple

try:
    import spacy  # type: ignore
except Exception:  # pragma: no cover - spaCy optional at import time
    spacy = None

try:
    from keybert import KeyBERT  # type: ignore
except Exception:  # pragma: no cover - KeyBERT optional at import time
    KeyBERT = None  # type: ignore

try:
    import yake  # type: ignore
except Exception:  # pragma: no cover - YAKE optional
    yake = None  # type: ignore


def extract_concepts(text: str, top_k: int = 25) -> List[Tuple[str, float]]:
    """Return (concept, score) pairs using spaCy + KeyBERT with YAKE fallback."""
    # First try KeyBERT (uses sentence-transformers under the hood)
    if KeyBERT is not None:
        try:
            kw_model = KeyBERT()
            keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 3), stop_words="english", top_n=top_k)
            return [(kw, float(score)) for kw, score in keywords]
        except Exception:
            pass

    # Fallback to YAKE if available
    if yake is not None:
        try:
            kw_extractor = yake.KeywordExtractor(top=top_k, stopwords=None)
            keywords = kw_extractor.extract_keywords(text)
            # YAKE returns (key, score) lower score is better; invert for consistency
            items = [(key, float(1.0 / (score + 1e-6))) for key, score in keywords]
            return items
        except Exception:
            pass

    # Final naive fallback: unique lowercased words with frequency as score
    tokens = [t.lower() for t in text.split() if t.isalpha() and len(t) > 3]
    freq: dict[str, int] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1
    items = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_k]
    return [(k, float(v)) for k, v in items]



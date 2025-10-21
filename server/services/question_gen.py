from __future__ import annotations

import random
from typing import Dict, List, Tuple


def generate_cloze_questions(sentences: List[str], concepts: List[Tuple[str, float]], max_q: int = 20) -> List[Dict]:
    results: List[Dict] = []
    concept_terms = [c for c, _ in concepts]
    for sent in sentences:
        for term in concept_terms:
            if term.lower() in sent.lower():
                blanked = _blank_term(sent, term)
                results.append({
                    "stem": blanked,
                    "qtype": "cloze",
                    "options": None,
                    "answer": {"value": term},
                    "concepts": [term],
                })
                break
        if len(results) >= max_q:
            break
    return results


def generate_mcq_from_concepts(concepts: List[Tuple[str, float]], num_options: int = 4, max_q: int = 20) -> List[Dict]:
    results: List[Dict] = []
    terms = [c for c, _ in concepts]
    for term in terms[:max_q]:
        distractors = [t for t in terms if t != term]
        random.shuffle(distractors)
        opts = [term] + distractors[: max(0, num_options - 1)]
        random.shuffle(opts)
        results.append({
            "stem": f"Which option best matches the concept: '{term}'?",
            "qtype": "mcq",
            "options": {"list": opts},
            "answer": {"value": term},
            "concepts": [term],
        })
    return results


def _blank_term(sentence: str, term: str) -> str:
    idx = sentence.lower().find(term.lower())
    if idx == -1:
        return sentence
    return sentence[:idx] + "_____" + sentence[idx + len(term):]



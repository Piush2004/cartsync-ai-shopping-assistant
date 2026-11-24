from typing import Any, Dict, Optional

from .types import AIContext
from services.stylist.brand_engine import BRAND_SIZE_STEPS

_MEASUREMENT_LABELS = [
    ("chest", "chest"),
    ("waist", "waist"),
    ("hip", "hip"),
    ("shoulder", "shoulder"),
    ("inseam", "inseam"),
]


def _brand_facts(brand_sizes: Optional[Dict[str, str]] = None) -> str:
    """
    One line per brand we know. When the shopper's size for each brand has
    been worked out in code, state that size outright: a small model told
    "runs small, go one size up" gets the direction wrong (it said Zara
    runs small, so size down), so it is never left to do that sum.
    """
    brand_sizes = brand_sizes or {}
    lines = []
    for brand, step in BRAND_SIZE_STEPS.items():
        name = brand.title()
        if step > 0:
            runs = "runs small"
        elif step < 0:
            runs = "runs large"
        else:
            runs = "is true to size"
        size = brand_sizes.get(name)
        if size:
            lines.append(f"{name} {runs}. The shopper's size in {name} is {size}.")
        elif step > 0:
            lines.append(f"{name} runs small, so go one size up.")
        elif step < 0:
            lines.append(f"{name} runs large, so go one size down.")
        else:
            lines.append(f"{name} is true to size.")
    return "\n".join(lines) or "None"


def _measurements_line(measurements: Optional[Dict[str, Any]]) -> str:
    if not measurements:
        return "Not saved yet."
    parts = [
        f"{label} {measurements[key]:g} cm"
        for key, label in _MEASUREMENT_LABELS
        if measurements.get(key)
    ]
    return ", ".join(parts) or "Not saved yet."


class PromptBuilder:
    SYSTEM_TEMPLATE = """You are the CartSync stylist. You help a shopper pick a clothing size.
Rules:
- Use only the facts below. Never invent a size, measurement, price or product.
- The recommended size below is final. Explain it, do not change it.
- The brand sizes below are final too. Quote them exactly. Never work out a size yourself.
- If the shopper asks for a looser or oversized fit, suggest the size-up option below.
- If they ask about their own measurements, read them from the body measurements below.
- Only if the size below is N/A, say you need their body measurements first.
- If the question is not answered by the facts below, say you don't know.
- Answer in plain everyday words, in at most three short sentences.
- Do not mention confidence numbers, scores, or how the system works.

User Context:
Preferred Fit: {preferred_fit}
Favorite Brands: {favorite_brands}
Body measurements: {measurements}

Stylist Recommendation:
Size: {size}
Size-up option: {size_up}
Confidence: {confidence}

Product Intelligence:
{products}

Brand facts (the only brand sizing facts you have):
{brand_facts}
"""
    @staticmethod
    def build_prompt(context: AIContext, current_question: str) -> str:
        rec = context.stylist_recommendation or {}

        pref_fit = context.user_profile.get("preferred_fit", "None")
        brands = ", ".join(context.user_profile.get("favorite_brands", []))

        size = rec.get("size", "N/A") if rec else "N/A"
        conf = rec.get("confidence", "N/A") if rec else "N/A"
        size_up = rec.get("size_up") or "N/A"

        prods = "None"
        if context.product_recommendations:
            prod_strings = []
            for p in context.product_recommendations:
                prod_strings.append(f"{p.get('name')} (Score: {p.get('score')}%) - Size: {p.get('size')}")
            prods = "\n".join(prod_strings)

        system_prompt = PromptBuilder.SYSTEM_TEMPLATE.format(
            preferred_fit=pref_fit,
            favorite_brands=brands,
            measurements=_measurements_line(rec.get("measurements")),
            size=size,
            size_up=size_up,
            confidence=conf,
            products=prods,
            brand_facts=_brand_facts(rec.get("brand_sizes")),
        )

        return f"{system_prompt}\n\nUser Question: {current_question}"

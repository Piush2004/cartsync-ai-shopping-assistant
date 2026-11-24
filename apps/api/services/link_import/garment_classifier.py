import re
from typing import Optional, Tuple

from services.stylist.types import CATEGORY_BOTTOM, CATEGORY_DRESS, CATEGORY_TOP

# Keyword lists, checked as whole words against the product's own title.
# Order matters only between lists: dress words are checked first because a
# title like "Shirt Dress" is a dress, not a shirt.
_DRESS_WORDS = [
    "dress", "dresses", "gown", "jumpsuit", "playsuit", "romper", "kurta", "kurti",
    "anarkali", "saree", "sari", "lehenga", "kaftan", "dungaree", "dungarees",
]
_BOTTOM_WORDS = [
    "jeans", "jean", "trouser", "trousers", "chino", "chinos", "pant", "pants",
    "shorts", "skirt", "skirts", "leggings", "legging", "jeggings", "joggers",
    "jogger", "palazzo", "palazzos", "culottes", "capri", "capris", "trackpants",
    "cargos", "cargo",
]
_WOMEN_WORDS = ["women", "woman", "womens", "ladies", "girls", "girl"]
_MEN_WORDS = ["men", "man", "mens", "boys", "boy"]


def _has_word(text: str, words) -> bool:
    return any(re.search(rf"\b{re.escape(w)}\b", text) for w in words)


def classify_garment(product_name: str) -> Tuple[str, Optional[str]]:
    """
    Reads (category, department) off a product title, e.g.
    "Mr Bowerbird Men Navy Blue Slim Fit Chino" -> ("bottom", "men").

    Department is None when the title doesn't say -- callers then size on
    the general chart rather than guessing. Category falls back to "top",
    the most common garment and the pre-existing behaviour.
    """
    text = product_name.lower().replace("'", "")

    if _has_word(text, _DRESS_WORDS):
        category = CATEGORY_DRESS
    elif _has_word(text, _BOTTOM_WORDS):
        category = CATEGORY_BOTTOM
    else:
        category = CATEGORY_TOP

    # "women" must be tested before "men": \bmen\b doesn't match inside
    # "women", but a title can legitimately contain both words only via
    # "women", so women wins whenever it is present.
    if _has_word(text, _WOMEN_WORDS):
        department: Optional[str] = "women"
    elif _has_word(text, _MEN_WORDS):
        department = "men"
    else:
        department = None

    return category, department

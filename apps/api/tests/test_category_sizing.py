"""
Tests for category-aware sizing (services/stylist/sizing_engine.py) and the
product-title classifier that feeds it (services/link_import/garment_classifier.py).
"""
from typing import Any

import pytest

from services.link_import.garment_classifier import classify_garment
from services.stylist import RecommendationEngine, StylistContext
from services.stylist.sizing_engine import SizingEngine


def _ctx(**overrides):
    base: dict[str, Any] = dict(chest=95.0, waist=82.0, brand_name="Some Brand", fit_preference="Regular")
    base.update(overrides)
    return StylistContext(**base)


# --- classifier ---------------------------------------------------------

@pytest.mark.parametrize(
    "title,expected",
    [
        ("Mr Bowerbird Men Navy Blue Slim Fit Chino", ("bottom", "men")),
        ("Levis Women High Rise Skinny Jeans", ("bottom", "women")),
        ("Allen Solly Men Polo Collar T-shirt", ("top", "men")),
        ("Women Floral Print Fit & Flare Dress", ("dress", "women")),
        ("Women Printed Shirt Dress", ("dress", "women")),
        ("Anouk Women Embroidered Kurta", ("dress", "women")),
        ("Oversized Cotton Hoodie", ("top", None)),
    ],
)
def test_classify_garment_reads_category_and_department(title, expected):
    assert classify_garment(title) == expected


def test_women_is_not_mistaken_for_men():
    # "women" contains the letters "men" -- it must never classify as men.
    assert classify_garment("Women Cotton Top")[1] == "women"


# --- sizing -------------------------------------------------------------

def test_default_context_is_sized_as_a_top_on_chest_exactly_as_before():
    assert SizingEngine.size_with_basis(_ctx(chest=95.0)) == ("M", "chest")
    assert SizingEngine.size_with_basis(_ctx(chest=89.9)) == ("S", "chest")


def test_bottoms_are_sized_from_waist_not_chest():
    # Same chest, different waists -> different sizes. Before this change a
    # pair of jeans was sized from the chest.
    slim = SizingEngine.size_with_basis(_ctx(chest=95.0, waist=76.0, category="bottom"))
    wide = SizingEngine.size_with_basis(_ctx(chest=95.0, waist=96.0, category="bottom"))
    assert slim == ("S", "waist")
    assert wide == ("XL", "waist")


def test_womens_bottoms_take_the_larger_of_waist_and_hip():
    ctx = _ctx(waist=70.0, hip=104.0, category="bottom", department="women")
    # waist 70 -> S, hip 104 -> L: the hip decides.
    assert SizingEngine.size_with_basis(ctx) == ("L", "hip")


def test_womens_bottoms_without_hip_fall_back_to_waist():
    ctx = _ctx(waist=70.0, hip=None, category="bottom", department="women")
    assert SizingEngine.size_with_basis(ctx) == ("S", "waist")


def test_dress_takes_the_largest_of_bust_waist_and_hip():
    ctx = _ctx(chest=86.0, waist=68.0, hip=110.0, category="dress", department="women")
    # bust 86 -> S, waist 68 -> S, hip 110 -> XL.
    assert SizingEngine.size_with_basis(ctx) == ("XL", "hip")


def test_womens_tops_use_the_womens_chart():
    # 86 cm is S on the women's chart, and also S on the general chart, but
    # 80 cm is XS for women while the general chart bottoms out at S.
    assert SizingEngine.size_with_basis(_ctx(chest=80.0, department="women")) == ("XS", "chest")
    assert SizingEngine.size_with_basis(_ctx(chest=80.0)) == ("S", "chest")


# --- explanation --------------------------------------------------------

def test_bottom_explanation_names_the_waist_not_the_chest():
    rec = RecommendationEngine.get_recommendation(_ctx(waist=82.0, category="bottom"))
    assert "82 cm waist" in rec.reasoning[0]
    assert "chest" not in rec.reasoning[0]


def test_unknown_brand_is_told_to_check_the_brand_chart():
    rec = RecommendationEngine.get_recommendation(_ctx(brand_name="Mr Bowerbird"))
    assert any("general size chart" in r for r in rec.reasoning)


def test_brand_with_known_tendency_is_not_given_the_general_chart_caveat():
    rec = RecommendationEngine.get_recommendation(_ctx(brand_name="Zara"))
    assert not any("general size chart" in r for r in rec.reasoning)
    assert rec.recommended_size == "L"  # M on the chart, sized up for Zara

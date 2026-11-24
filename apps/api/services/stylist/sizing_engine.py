from typing import List, Optional, Tuple

from .types import CATEGORY_BOTTOM, CATEGORY_DRESS, SIZE_ORDER, StylistContext

# GENERAL size charts (body measurements in cm, upper bound exclusive).
# These are a generic alpha-size chart, NOT any specific brand's chart --
# real brands differ by a size in either direction, which is why every
# recommendation built on them says so (see explanation_engine.py). Brand-
# specific corrections belong in brand_engine.py, and only when there is a
# real source for them.
Chart = Tuple[List[Tuple[str, float]], str]  # ([(size, upper_bound)], size_above_last_bound)

_TOP_CHEST_GENERAL: Chart = ([("S", 90), ("M", 98), ("L", 106)], "XL")
_TOP_BUST_WOMEN: Chart = ([("XS", 82), ("S", 88), ("M", 94), ("L", 100), ("XL", 108)], "XXL")

_BOTTOM_WAIST_GENERAL: Chart = ([("S", 78), ("M", 86), ("L", 94), ("XL", 102)], "XXL")
_BOTTOM_WAIST_WOMEN: Chart = ([("XS", 66), ("S", 72), ("M", 78), ("L", 86), ("XL", 94)], "XXL")
_HIP_WOMEN: Chart = ([("XS", 90), ("S", 96), ("M", 102), ("L", 108), ("XL", 116)], "XXL")


def _lookup(value: float, chart: Chart) -> str:
    bounds, above = chart
    for size, upper in bounds:
        if value < upper:
            return size
    return above


def _larger(a: str, b: str) -> str:
    return a if SIZE_ORDER.index(a) >= SIZE_ORDER.index(b) else b


class SizingEngine:
    @staticmethod
    def calculate_base_size(ctx: StylistContext) -> str:
        return SizingEngine.size_with_basis(ctx)[0]

    @staticmethod
    def size_with_basis(ctx: StylistContext) -> Tuple[str, str]:
        """
        Returns (base_size, basis) where basis names the body measurement
        that decided the size ("chest", "waist" or "hip") -- so the
        explanation can tell the user the truth about why, instead of always
        saying "based on your chest" for a pair of jeans.
        """
        women = (ctx.department or "").lower() == "women"
        hip: Optional[float] = ctx.hip if ctx.hip and ctx.hip > 0 else None

        if ctx.category == CATEGORY_BOTTOM:
            size = _lookup(ctx.waist, _BOTTOM_WAIST_WOMEN if women else _BOTTOM_WAIST_GENERAL)
            basis = "waist"
            # Women's bottoms have to clear the hip as well as the waist --
            # take whichever asks for the larger size.
            if women and hip is not None:
                hip_size = _lookup(hip, _HIP_WOMEN)
                if _larger(hip_size, size) != size:
                    size, basis = hip_size, "hip"
            return size, basis

        if ctx.category == CATEGORY_DRESS:
            # A dress has to fit the largest of bust, waist and hip.
            size = _lookup(ctx.chest, _TOP_BUST_WOMEN)
            basis = "chest"
            if ctx.waist and ctx.waist > 0:
                waist_size = _lookup(ctx.waist, _BOTTOM_WAIST_WOMEN)
                if _larger(waist_size, size) != size:
                    size, basis = waist_size, "waist"
            if hip is not None:
                hip_size = _lookup(hip, _HIP_WOMEN)
                if _larger(hip_size, size) != size:
                    size, basis = hip_size, "hip"
            return size, basis

        # Tops (and anything unrecognised): chest decides.
        return _lookup(ctx.chest, _TOP_BUST_WOMEN if women else _TOP_CHEST_GENERAL), "chest"

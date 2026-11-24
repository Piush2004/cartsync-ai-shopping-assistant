from .types import SIZE_ORDER, StylistContext

# Size steps to apply for a brand, relative to the general chart. Only
# brands with a known tendency are listed -- every other brand is left at
# the general-chart size (and gets lower brand confidence, see
# confidence_engine.py). Add an entry here only with a real source for it;
# an invented offset is worse than none.
BRAND_SIZE_STEPS = {
    "zara": 1,     # runs small -> size up
    "uniqlo": 0,   # true to size
}


class BrandEngine:
    @staticmethod
    def has_brand_data(brand_name: str) -> bool:
        return brand_name.lower() in BRAND_SIZE_STEPS

    @staticmethod
    def adjust_for_brand(ctx: StylistContext, base_size: str) -> str:
        if base_size not in SIZE_ORDER:
            return base_size
        step = BRAND_SIZE_STEPS.get(ctx.brand_name.lower(), 0)
        idx = SIZE_ORDER.index(base_size) + step
        return SIZE_ORDER[max(0, min(idx, len(SIZE_ORDER) - 1))]

from .types import StylistContext

class BrandEngine:
    @staticmethod
    def adjust_for_brand(ctx: StylistContext, base_size: str) -> str:
        # Simplified, hardcoded brand-fit adjustment table (not "mock" -- this
        # is the real, deterministic sizing logic for V1; there is no
        # external brand-sizing database to query yet).
        sizes = ["XS", "S", "M", "L", "XL"]
        if base_size not in sizes:
            return base_size
        
        idx = sizes.index(base_size)
        
        # Zara runs small -> size up
        if ctx.brand_name.lower() == "zara":
            return sizes[min(idx + 1, len(sizes) - 1)]
            
        # Uniqlo runs slightly loose but we'll say true to size
        if ctx.brand_name.lower() == "uniqlo":
            return base_size
            
        return base_size

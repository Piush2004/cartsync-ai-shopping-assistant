from .types import StylistContext

class PreferenceEngine:
    @staticmethod
    def adjust_for_preference(ctx: StylistContext, current_size: str) -> str:
        sizes = ["XS", "S", "M", "L", "XL"]
        if current_size not in sizes:
            return current_size
            
        idx = sizes.index(current_size)
        
        pref = ctx.fit_preference.lower()
        if pref == "oversized" or pref == "relaxed":
            return sizes[min(idx + 1, len(sizes) - 1)]
        elif pref == "slim":
            return sizes[max(idx - 1, 0)]
            
        return current_size

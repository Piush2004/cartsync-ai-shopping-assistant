from .types import SIZE_ORDER, StylistContext

class PreferenceEngine:
    @staticmethod
    def adjust_for_preference(ctx: StylistContext, current_size: str) -> str:
        if current_size not in SIZE_ORDER:
            return current_size

        idx = SIZE_ORDER.index(current_size)

        pref = ctx.fit_preference.lower()
        if pref == "oversized" or pref == "relaxed":
            return SIZE_ORDER[min(idx + 1, len(SIZE_ORDER) - 1)]
        elif pref == "slim":
            return SIZE_ORDER[max(idx - 1, 0)]

        return current_size

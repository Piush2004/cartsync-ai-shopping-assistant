from .types import StylistContext

class SizingEngine:
    @staticmethod
    def calculate_base_size(ctx: StylistContext) -> str:
        # Simple generic sizing chart based on Chest
        if ctx.chest < 90:
            return "S"
        elif ctx.chest < 98:
            return "M"
        elif ctx.chest < 106:
            return "L"
        else:
            return "XL"

from .types import Intent

class IntentDetector:
    @staticmethod
    def detect(question: str) -> Intent:
        q = question.lower()
        if "product" in q or "shirt" in q or "recommend" in q:
            return Intent(category="product", confidence=0.95)
        elif "brand" in q or "zara" in q or "nike" in q:
            return Intent(category="brand", confidence=0.90)
        elif "preference" in q or "oversized" in q or "slim" in q:
            return Intent(category="preferences", confidence=0.90)
        elif "measurement" in q or "change" in q or "why" in q:
            return Intent(category="measurement", confidence=0.85)
        elif "size" in q or "fit" in q:
            return Intent(category="sizing", confidence=0.95)
        else:
            return Intent(category="general", confidence=0.50)

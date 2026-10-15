from typing import Dict, Any, List
from .types import AIContext, Intent, Message

class ContextBuilder:
    @staticmethod
    def build(
        user_profile: Dict[str, Any],
        intent: Intent,
        history: List[Message],
        stylist_rec: Dict[str, Any] = None,
        product_recs: List[Dict[str, Any]] = None
    ) -> AIContext:
        return AIContext(
            user_profile=user_profile,
            stylist_recommendation=stylist_rec,
            product_recommendations=product_recs,
            conversation_history=history,
            intent=intent
        )

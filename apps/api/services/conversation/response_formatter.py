from .types import ConversationResponse, Intent
from typing import List

class ResponseFormatter:
    @staticmethod
    def format(raw_llm_response: str, intent: Intent, sources: List[str]) -> ConversationResponse:
        return ConversationResponse(
            answer=raw_llm_response,
            sources=sources,
            confidence=0.95, # In reality, could be parsed from LLM or deterministic engine
            intent_detected=intent.category
        )

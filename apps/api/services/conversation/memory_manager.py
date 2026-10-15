from typing import List
from .types import Message

class MemoryManager:
    # In a real app, this reads/writes from Redis or PostgreSQL.
    # For now, it simply returns the list or truncates if needed.
    @staticmethod
    def get_recent_history(user_id: str) -> List[Message]:
        return []
    
    @staticmethod
    def save_interaction(user_id: str, question: str, response: str):
        pass

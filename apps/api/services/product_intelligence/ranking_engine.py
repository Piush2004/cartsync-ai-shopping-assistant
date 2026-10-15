from typing import List
from .types import ScoredProduct

class RankingEngine:
    @staticmethod
    def rank(scored_products: List[ScoredProduct]) -> List[ScoredProduct]:
        return sorted(scored_products, key=lambda x: x.fit_score, reverse=True)

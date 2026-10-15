from typing import List
from .types import Product, ProductIntelligenceRequest

class FilteringEngine:
    @staticmethod
    def filter(products: List[Product], req: ProductIntelligenceRequest) -> List[Product]:
        # Currently no strict filters (like gender/out of stock), just returning all products
        return products

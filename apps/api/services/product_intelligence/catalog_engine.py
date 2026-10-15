from typing import List
from .types import Product

class CatalogEngine:
    @staticmethod
    def get_all_products() -> List[Product]:
        return [
            Product(id="nike_air_tee", name="Nike Air Tee", brand="Nike", category="T-Shirt", fit_type="Relaxed"),
            Product(id="nike_pro_tight", name="Nike Pro Tight Fit", brand="Nike", category="T-Shirt", fit_type="Slim"),
            Product(id="zara_essential_tee", name="Zara Essential Tee", brand="Zara", category="T-Shirt", fit_type="Slim"),
            Product(id="zara_oversized_hoodie", name="Zara Oversized Hoodie", brand="Zara", category="Hoodie", fit_type="Oversized"),
            Product(id="uniqlo_u_crew", name="Uniqlo U Crew Neck", brand="Uniqlo", category="T-Shirt", fit_type="Regular"),
            Product(id="hm_slim_jeans", name="H&M Slim Fit Jeans", brand="H&M", category="Jeans", fit_type="Slim"),
            Product(id="levis_501", name="Levi's 501 Original Fit", brand="Levi's", category="Jeans", fit_type="Regular"),
        ]

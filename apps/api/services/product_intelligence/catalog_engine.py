from typing import List
from . import catalog_import
from .types import Product

class CatalogEngine:
    @staticmethod
    def get_all_products() -> List[Product]:
        # Products read from real pages (import_catalog.py) come after the
        # seed ones; a seed product wins if an id is ever repeated.
        products = CatalogEngine._seed_products()
        known = {p.id for p in products}
        for imported in catalog_import.load_imported_products():
            if imported.id not in known:
                known.add(imported.id)
                products.append(imported)
        return products

    @staticmethod
    def _seed_products() -> List[Product]:
        return [
            Product(id="nike_air_tee", name="Nike Air Tee", brand="Nike", category="T-Shirt", fit_type="Relaxed"),
            Product(id="nike_pro_tight", name="Nike Pro Tight Fit", brand="Nike", category="T-Shirt", fit_type="Slim"),
            Product(id="zara_essential_tee", name="Zara Essential Tee", brand="Zara", category="T-Shirt", fit_type="Slim"),
            Product(id="zara_oversized_hoodie", name="Zara Oversized Hoodie", brand="Zara", category="Hoodie", fit_type="Oversized"),
            Product(id="uniqlo_u_crew", name="Uniqlo U Crew Neck", brand="Uniqlo", category="T-Shirt", fit_type="Regular"),
            Product(id="hm_slim_jeans", name="H&M Slim Fit Jeans", brand="H&M", category="Jeans", fit_type="Slim"),
            Product(id="levis_501", name="Levi's 501 Original Fit", brand="Levi's", category="Jeans", fit_type="Regular"),
        ]

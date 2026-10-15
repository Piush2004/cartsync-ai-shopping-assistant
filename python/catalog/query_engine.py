from typing import List, Dict, Any, Optional
from firebase_admin import firestore
from catalog.schema import Product

class CatalogQueryEngine:
    def __init__(self):
        # We assume Firebase app is already initialized via main pipeline or config
        self.db = firestore.client()
        self.collection = self.db.collection("catalog")

    def query(self, 
              category: Optional[str] = None,
              brand: Optional[str] = None,
              gender: Optional[str] = None,
              size: Optional[str] = None,
              min_price: Optional[float] = None,
              max_price: Optional[float] = None,
              keyword: Optional[str] = None,
              in_stock_only: bool = True,
              limit: int = 50,
              offset: int = 0,
              sort_by: str = "price",
              sort_desc: bool = False) -> List[Product]:
        
        query_ref = self.collection

        # Basic exact match filtering
        if category:
            query_ref = query_ref.where("category", "==", category)
        if brand:
            query_ref = query_ref.where("brand", "==", brand)
        if gender:
            query_ref = query_ref.where("gender", "==", gender)
        
        # NOTE: Firestore doesn't support multiple inequalities on different fields out-of-the-box easily 
        # without composite indexes, but we do basic price filtering
        if min_price is not None:
            query_ref = query_ref.where("price", ">=", min_price)
        if max_price is not None:
            query_ref = query_ref.where("price", "<=", max_price)

        if sort_desc:
            query_ref = query_ref.order_by(sort_by, direction=firestore.Query.DESCENDING)
        else:
            query_ref = query_ref.order_by(sort_by, direction=firestore.Query.ASCENDING)
            
        # Execute query (apply limits/offsets manually or via API)
        # Note: Firestore offset is expensive; this is a simplified simulation
        docs = query_ref.stream()
        
        products = []
        for doc in docs:
            data = doc.to_dict()
            products.append(Product(**data))
            
        # Post-process filtering that Firestore can't easily do dynamically
        filtered = []
        for p in products:
            if size and size not in p.available_sizes:
                continue
            
            if in_stock_only:
                # Check if specific size is in stock, or overall if no size specified
                if size:
                    if p.inventory.get(size, 0) <= 0:
                        continue
                else:
                    if sum(p.inventory.values()) <= 0:
                        continue
                        
            if keyword:
                kw = keyword.lower()
                if kw not in p.title.lower() and kw not in p.description.lower() and not any(kw in t.lower() for t in p.tags):
                    continue
                    
            filtered.append(p)
            
        # Apply pagination
        return filtered[offset : offset + limit]

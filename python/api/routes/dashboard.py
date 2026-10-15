from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from catalog.preferences import UserProfileEngine
from catalog.query_engine import CatalogQueryEngine
from catalog.ranking_engine import ProductRankingEngine
from catalog.outfit_engine import OutfitRecommendationEngine
from pipeline.context import PipelineContext
from utils.logger import logger

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/{user_id}")
async def get_dashboard(user_id: str) -> Dict[str, Any]:
    """
    Backend for Frontend (BFF) endpoint that aggregates all data needed for the Next.js dashboard.
    """
    try:
        # 1. Fetch User Profile
        profile_engine = UserProfileEngine()
        user_profile = profile_engine.get_profile(user_id)
        
        saved_measurements = user_profile.saved_measurements or {}
        saved_sizing = user_profile.saved_size_recommendations or {}
        
        # 2. Build Pipeline Context to re-run ranking (or we could cache this in Firestore)
        context = PipelineContext(
            user_id=user_id,
            measurements=saved_measurements,
            size_recommendations=saved_sizing,
            fit_preference=user_profile.preferences.fit_preference
        )
        
        # 3. Fetch Catalog Products matching preferences (Mock: get first 50)
        query_engine = CatalogQueryEngine()
        # For simplicity, just get in_stock items. In production, we'd query by favorite brands/categories
        products = query_engine.query(limit=20)
        
        # 4. Rank Products
        ranked_products = ProductRankingEngine.rank_products(products, context)
        
        # 5. Generate Outfits
        outfits = OutfitRecommendationEngine.generate_outfits(user_profile, ranked_products.copy(), num_outfits=1)
        
        # Convert Pydantic models to dicts for JSON serialization
        top_products = [rp.model_dump() for rp in ranked_products[:5]]
        
        # Optional: Fetch recent feedback
        
        return {
            "profile": user_profile.model_dump(),
            "measurements": saved_measurements,
            "sizeRecommendations": saved_sizing,
            "recommendedProducts": top_products,
            "recommendedOutfit": outfits[0] if outfits else None,
            "recentFeedback": []
        }
    except Exception as e:
        logger.error("Error generating dashboard", user_id=user_id, error=str(e))
        # Return fallback mock data or empty structure if something fails (e.g. no Firebase credentials locally)
        raise HTTPException(status_code=500, detail=str(e))

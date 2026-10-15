from services.product_intelligence.scoring_engine import ScoringEngine
from services.product_intelligence.ranking_engine import RankingEngine
from services.product_intelligence.types import Product, ProductIntelligenceRequest, ScoredProduct
from services.stylist import StylistRecommendation, ConfidenceBreakdown

def mock_request() -> ProductIntelligenceRequest:
    stylist_rec = StylistRecommendation(
        recommended_size="M",
        fit="Regular",
        confidence=ConfidenceBreakdown(overall=0.9, measurement=0.9, brand=0.9, preference=0.9),
        reasoning=[],
        alternatives=[]
    )
    return ProductIntelligenceRequest(
        preferences={"fit_preference": "Slim"},
        stylist_recommendation=stylist_rec,
        brand_affinity=["Nike", "Zara"]
    )

def test_scoring_engine():
    req = mock_request()
    
    # 1. Product that matches brand AND fit preference perfectly
    prod_perfect = Product(id="1", name="A", brand="Nike", category="T-Shirt", fit_type="Slim")
    score_perfect = ScoringEngine.calculate_score(prod_perfect, req)
    
    # Expected score:
    # Fit (Slim == Slim) -> 0.40
    # Brand (Nike in ["Nike", "Zara"]) -> 0.30
    # Stylist Conf (0.9 * 0.30) -> 0.27
    # Total = 0.97
    assert score_perfect == 0.97
    
    # 2. Product that matches neither
    prod_none = Product(id="2", name="B", brand="H&M", category="T-Shirt", fit_type="Oversized")
    score_none = ScoringEngine.calculate_score(prod_none, req)
    
    # Expected score:
    # Fit (Oversized != Slim) -> 0.0
    # Brand (H&M not in affinity) -> 0.0
    # Stylist Conf (0.9 * 0.30) -> 0.27
    # Total = 0.27
    assert score_none == 0.27

def test_ranking_engine():
    prod1 = ScoredProduct(
        product=Product(id="1", name="A", brand="Brand", category="Cat", fit_type="Fit"),
        recommended_size="M", fit_score=0.50, confidence=0.9, reason=[]
    )
    prod2 = ScoredProduct(
        product=Product(id="2", name="B", brand="Brand", category="Cat", fit_type="Fit"),
        recommended_size="M", fit_score=0.97, confidence=0.9, reason=[]
    )
    prod3 = ScoredProduct(
        product=Product(id="3", name="C", brand="Brand", category="Cat", fit_type="Fit"),
        recommended_size="M", fit_score=0.20, confidence=0.9, reason=[]
    )
    
    ranked = RankingEngine.rank([prod1, prod2, prod3])
    
    assert ranked[0].product.id == "2" # Highest score
    assert ranked[1].product.id == "1"
    assert ranked[2].product.id == "3"

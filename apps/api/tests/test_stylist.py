import pytest
from services.stylist import RecommendationEngine, StylistContext

def test_same_measurements_different_brands():
    # 95 Chest -> M base
    ctx_nike = StylistContext(chest=95.0, waist=82.0, brand_name="Nike", fit_preference="Regular")
    rec_nike = RecommendationEngine.get_recommendation(ctx_nike)
    assert rec_nike.recommended_size == "M"
    
    ctx_zara = StylistContext(chest=95.0, waist=82.0, brand_name="Zara", fit_preference="Regular")
    rec_zara = RecommendationEngine.get_recommendation(ctx_zara)
    assert rec_zara.recommended_size == "L", "Zara runs small, should size up"

def test_same_measurements_different_fits():
    # 95 Chest -> M base for Nike
    ctx_regular = StylistContext(chest=95.0, waist=82.0, brand_name="Nike", fit_preference="Regular")
    rec_regular = RecommendationEngine.get_recommendation(ctx_regular)
    assert rec_regular.recommended_size == "M"
    
    ctx_oversized = StylistContext(chest=95.0, waist=82.0, brand_name="Nike", fit_preference="Oversized")
    rec_oversized = RecommendationEngine.get_recommendation(ctx_oversized)
    assert rec_oversized.recommended_size == "L", "Oversized pref should size up"
    
    ctx_slim = StylistContext(chest=95.0, waist=82.0, brand_name="Nike", fit_preference="Slim")
    rec_slim = RecommendationEngine.get_recommendation(ctx_slim)
    assert rec_slim.recommended_size == "S", "Slim pref should size down"

def test_missing_preferences():
    # Empty preference string
    ctx_missing = StylistContext(chest=95.0, waist=82.0, brand_name="Nike", fit_preference="")
    rec_missing = RecommendationEngine.get_recommendation(ctx_missing)
    assert rec_missing.recommended_size == "M"
    assert rec_missing.confidence.preference < 0.80, "Preference confidence should be low if missing"

def test_low_confidence():
    # Missing measurements (e.g. chest = 0)
    ctx_bad_data = StylistContext(chest=0.0, waist=0.0, brand_name="Unknown", fit_preference="")
    rec = RecommendationEngine.get_recommendation(ctx_bad_data)
    assert rec.confidence.overall < 0.60
    assert rec.confidence.measurement < 0.60

def test_boundary_values():
    # Chest 89 -> S
    ctx_s = StylistContext(chest=89.9, waist=80.0, brand_name="Nike", fit_preference="Regular")
    rec_s = RecommendationEngine.get_recommendation(ctx_s)
    assert rec_s.recommended_size == "S"
    
    # Chest 90 -> M
    ctx_m = StylistContext(chest=90.0, waist=80.0, brand_name="Nike", fit_preference="Regular")
    rec_m = RecommendationEngine.get_recommendation(ctx_m)
    assert rec_m.recommended_size == "M"

from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    product_category_id = Column(String, ForeignKey("product_categories.id"))
    brand_id = Column(String, nullable=True) # Could link to a Brand table
    recommended_size = Column(String)
    confidence_overall = Column(Float)
    confidence_breakdown = Column(JSON) # e.g. {"measurement": 0.98, "brand": 0.88, ...}
    reasoning = Column(JSON) # list of strings
    alternatives = Column(JSON) # list of alternative sizes
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"
    id = Column(String, primary_key=True, index=True)
    recommendation_id = Column(String, ForeignKey("recommendation_history.id"))
    user_id = Column(String, ForeignKey("users.id"))
    was_accurate = Column(Boolean)
    actual_purchased_size = Column(String, nullable=True)
    fit_feedback = Column(String, nullable=True) # e.g. "too_small", "perfect"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BrandSizeChart(Base):
    __tablename__ = "brand_size_charts"
    id = Column(String, primary_key=True, index=True)
    brand_name = Column(String, index=True)
    product_category_id = Column(String, ForeignKey("product_categories.id"))
    size_label = Column(String) # e.g. "S", "M", "L"
    chest_min = Column(Float, nullable=True)
    chest_max = Column(Float, nullable=True)
    waist_min = Column(Float, nullable=True)
    waist_max = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProductCategory(Base):
    __tablename__ = "product_categories"
    id = Column(String, primary_key=True, index=True)
    name = Column(String) # e.g. "T-Shirt", "Jeans", "Jacket"
    measurement_type = Column(String) # e.g. "top", "bottom"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StyleRule(Base):
    __tablename__ = "style_rules"
    id = Column(String, primary_key=True, index=True)
    fit_preference = Column(String) # e.g. "Relaxed", "Slim"
    size_adjustment = Column(Integer) # e.g. +1 for Relaxed, 0 for Regular, -1 for Slim
    created_at = Column(DateTime(timezone=True), server_default=func.now())

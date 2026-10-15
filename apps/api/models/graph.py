from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class BrandAffinity(Base):
    """
    Derived from user purchase history and explicit preferences.
    """
    __tablename__ = "brand_affinity"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    brand_id = Column(String, nullable=False) # e.g. 'nike'
    
    affinity_score = Column(Float) # 0.0 to 1.0
    size_offset = Column(Float, default=0.0) # e.g. +1 (user prefers larger sizes in this brand)
    
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class UserPreference(Base):
    """
    Explicit (stated) and Implicit (learned) style preferences.
    """
    __tablename__ = "user_preferences"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    fit_preference = Column(String) # e.g. 'slim', 'relaxed', 'oversized'
    price_sensitivity = Column(Float) # 0.0 (budget) to 1.0 (luxury)
    style_dna = Column(JSON) # e.g. ["athleisure", "minimalist"]
    
    last_updated = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

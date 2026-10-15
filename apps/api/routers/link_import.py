from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from core.deps import get_current_user
from core.rate_limit import limiter
from database import get_db
from models.graph import UserPreference
from models.measurement import EffectiveMeasurement
from models.user import User
from schemas.link_import import LinkImportRequest, LinkImportResponse
from services.link_import import ExtractionError, FetchError, extract_product, fetch_product_page
from services.stylist import RecommendationEngine, StylistContext, StylistRecommendation

router = APIRouter()


def _compute_fit_guide(db: Session, current_user: User, brand: Optional[str]) -> Optional[StylistRecommendation]:
    """
    Same measurement/preference lookup and RecommendationEngine call as
    GET /stylist/recommendation (routers/stylist.py) -- reused, not
    reimplemented. Differs only in what happens when data is missing: that
    endpoint 400s outright, but here the product preview is still useful
    on its own, so a missing prerequisite just means no fit guide rather
    than a failed request.
    """
    if not brand:
        return None

    eff_meas = db.query(EffectiveMeasurement).filter(EffectiveMeasurement.user_id == current_user.id).first()
    if not eff_meas or not eff_meas.chest_circumference:
        return None

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    fit_pref = pref.fit_preference if pref and pref.fit_preference else "Regular"

    ctx = StylistContext(
        chest=eff_meas.chest_circumference,
        waist=eff_meas.waist_circumference or 0.0,
        brand_name=brand,
        fit_preference=fit_pref,
    )
    return RecommendationEngine.get_recommendation(ctx)


@router.post("/preview", response_model=LinkImportResponse)
@limiter.limit("10/minute")
def preview(
    request: Request,
    payload: LinkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        html = fetch_product_page(payload.url)
        product = extract_product(html, payload.url)
    except (FetchError, ExtractionError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    fit_guide = _compute_fit_guide(db, current_user, product.brand)

    return LinkImportResponse(
        name=product.name,
        brand=product.brand,
        image_url=product.image_url,
        price=product.price,
        source_url=payload.url,
        fit_guide=fit_guide,
    )

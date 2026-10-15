from typing import Optional

from pydantic import BaseModel

from services.stylist import StylistRecommendation


class LinkImportRequest(BaseModel):
    url: str


class LinkImportResponse(BaseModel):
    name: str
    brand: Optional[str] = None
    image_url: str
    price: Optional[float] = None
    source_url: str
    # None when the user has no measurements on file yet -- the product
    # preview is still useful without one, so this isn't an error case.
    fit_guide: Optional[StylistRecommendation] = None

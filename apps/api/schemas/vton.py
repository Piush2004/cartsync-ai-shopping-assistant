from pydantic import BaseModel


class VTONResponse(BaseModel):
    image_url: str

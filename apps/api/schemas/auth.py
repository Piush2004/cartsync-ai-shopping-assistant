from typing import Optional

from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str = None


class GoogleLoginRequest(BaseModel):
    # The ID token Google's sign-in gives the app. A real one is ~1 KB.
    id_token: str = Field(min_length=20, max_length=8192)


class AuthConfig(BaseModel):
    # None when Google sign-in is not set up on this server.
    google_client_id: Optional[str] = None

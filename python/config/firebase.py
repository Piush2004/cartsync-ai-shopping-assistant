from pydantic_settings import BaseSettings

class FirebaseConfig(BaseSettings):
    PROJECT_ID: str = "mock-project"
    CREDENTIALS_PATH: str | None = None
    
    class Config:
        env_prefix = "FIREBASE_"
        env_file = ".env"
        extra = "ignore"

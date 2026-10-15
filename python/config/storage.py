from pydantic_settings import BaseSettings

class StorageConfig(BaseSettings):
    BUCKET: str = "mock.appspot.com"
    
    class Config:
        env_prefix = "STORAGE_"
        env_file = ".env"
        extra = "ignore"

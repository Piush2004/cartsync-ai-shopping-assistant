from pydantic_settings import BaseSettings

class ModelsConfig(BaseSettings):
    MEASUREMENT_ENGINE_VERSION: str = "1.0.0"
    DEPTH_MODEL: str = "v2-base"
    MEDIAPIPE_VERSION: str = "0.10.0"
    AVATAR_MODEL: str = "1.0.0"
    
    class Config:
        env_prefix = "MODEL_"
        env_file = ".env"
        extra = "ignore"

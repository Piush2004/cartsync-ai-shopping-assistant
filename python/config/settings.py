from config.firebase import FirebaseConfig
from config.storage import StorageConfig
from config.runtime import RuntimeConfig
from config.models import ModelsConfig

class Settings:
    firebase = FirebaseConfig()
    storage = StorageConfig()
    runtime = RuntimeConfig()
    models = ModelsConfig()

settings = Settings()

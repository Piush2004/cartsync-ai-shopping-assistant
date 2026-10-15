import firebase_admin
from firebase_admin import credentials, firestore, storage
from config.settings import settings
import os

def init_firebase():
    if not firebase_admin._apps:
        try:
            if settings.firebase.CREDENTIALS_PATH and os.path.exists(settings.firebase.CREDENTIALS_PATH):
                cred = credentials.Certificate(settings.firebase.CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': settings.storage.BUCKET,
                    'projectId': settings.firebase.PROJECT_ID
                })
            else:
                firebase_admin.initialize_app(options={
                    'storageBucket': settings.storage.BUCKET,
                    'projectId': settings.firebase.PROJECT_ID
                })
        except Exception as e:
            print(f"Warning: Firebase init failed, continuing in mock mode: {e}")

init_firebase()

def get_db():
    try:
        return firestore.client()
    except Exception:
        return None

def get_bucket():
    try:
        return storage.bucket()
    except Exception:
        return None

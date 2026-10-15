from typing import Optional
from firebase_admin import firestore
from catalog.schema import UserProfile, UserPreferences

class UserProfileEngine:
    def __init__(self):
        self.db = firestore.client()
        self.collection = self.db.collection("users")

    def get_profile(self, user_id: str) -> UserProfile:
        doc = self.collection.document(user_id).get()
        if doc.exists:
            return UserProfile(**doc.to_dict())
        else:
            # Return empty default profile
            return UserProfile(
                user_id=user_id,
                preferences=UserPreferences()
            )

    def update_preferences(self, user_id: str, preferences: UserPreferences) -> None:
        self.collection.document(user_id).set({
            "preferences": preferences.dict()
        }, merge=True)

    def save_measurements(self, user_id: str, measurements: dict, sizing: dict, timestamp: str) -> None:
        self.collection.document(user_id).set({
            "saved_measurements": measurements,
            "saved_size_recommendations": sizing,
            "last_measured_at": timestamp
        }, merge=True)

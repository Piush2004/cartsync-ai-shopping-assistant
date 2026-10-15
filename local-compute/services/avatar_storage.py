import firebase_admin
from firebase_admin import firestore

class AvatarStorageService:
    def save_avatar_metadata(self, metadata: dict) -> None:
        """
        Saves the avatar metadata record in Firestore under 'avatars'
        and associates it as the user's active avatar inside 'users'.
        """
        uid = metadata.get("uid")
        avatar_id = metadata.get("avatarId")
        
        try:
            db = firestore.client()
            
            # Save into the top-level 'avatars' collection
            db.collection('avatars').document(avatar_id).set(metadata)
            
            # Set this avatar as the active avatar on the user's profile
            user_ref = db.collection('users').document(uid)
            user_ref.set({
                "currentAvatarId": avatar_id,
                "updatedAt": metadata.get("updatedAt")
            }, merge=True)
            
            print(f"[AvatarStorage] Avatar metadata successfully saved for user: {uid}")
        except Exception as e:
            print(f"[AvatarStorage] Warning: Failed to write avatar to Firestore: {e}")

avatar_storage_service = AvatarStorageService()

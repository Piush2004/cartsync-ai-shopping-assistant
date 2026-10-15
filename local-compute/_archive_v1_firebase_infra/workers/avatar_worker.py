from workers.base_worker import BaseWorker
from services.smpl_generator import smpl_generator_service
from services.avatar_builder import avatar_builder_service
from services.avatar_storage import avatar_storage_service
from firebase_admin import firestore

class AvatarWorker(BaseWorker):
    def __init__(self):
        super().__init__("AvatarWorker", ["AVATAR"])

    def execute(self, payload: dict) -> dict:
        """
        Coordinates the avatar generation workflow:
        1. Fetch measurement profile from Firestore
        2. Generate SMPL shape parameters (betas)
        3. Build complete avatar metadata record
        4. Save to Firestore and link to user
        """
        uid = payload.get("uid")
        if not uid:
            raise ValueError("Payload missing user identifier ('uid').")

        print(f"[AvatarWorker] Commencing avatar creation for user: {uid}")

        # --- STEP 1: FETCH MEASUREMENT PROFILE ---
        try:
            db = firestore.client()
            profile_ref = db.collection('measurementProfiles').document(uid)
            profile_doc = profile_ref.get()
        except Exception as e:
            raise RuntimeError(f"Database error during measurement profile fetch: {e}")

        if not profile_doc.exists:
            raise ValueError(f"No measurement profile found for user: {uid}. Please calculate measurements before creating an avatar.")

        # Engine expects: heightCm, chestCm, waistCm, hipsCm, inseamCm, shoulderWidthCm
        profile = profile_doc.to_dict()
        
        # Normalize keys in case the profile uses different casing
        measurements = {
            "heightCm": float(profile.get("heightCm") or profile.get("height", 0)),
            "shoulderWidthCm": float(profile.get("shoulderWidthCm") or profile.get("shoulderWidth", 0)),
            "chestCm": float(profile.get("chestCm") or profile.get("chest", 0)),
            "waistCm": float(profile.get("waistCm") or profile.get("waist", 0)),
            "hipsCm": float(profile.get("hipsCm") or profile.get("hips", 0)),
            "inseamCm": float(profile.get("inseamCm") or profile.get("inseam", 0)),
            "sleeveCm": float(profile.get("sleeveCm") or 0),
            "neckCm": float(profile.get("neckCm") or 0)
        }

        # --- STEP 2: GENERATE SMPL SHAPE COEFFICIENTS ---
        print("[AvatarWorker] Stage 1/3: Generating SMPL shape parameters...")
        shape_params = smpl_generator_service.generate_shape_parameters(
            measurements["heightCm"],
            measurements["chestCm"],
            measurements["waistCm"],
            measurements["hipsCm"],
            measurements["inseamCm"]
        )

        # --- STEP 3: CONSTRUCT METADATA ---
        print("[AvatarWorker] Stage 2/3: Building avatar metadata specs...")
        metadata = avatar_builder_service.build_avatar_metadata(
            uid,
            measurements,
            shape_params
        )

        # --- STEP 4: WRITE TO STORAGE ---
        print("[AvatarWorker] Stage 3/3: Committing avatar records to Firestore...")
        avatar_storage_service.save_avatar_metadata(metadata)

        # Log event in activityTimeline
        try:
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            db.collection('activityTimeline').add({
                "uid": uid,
                "eventType": "Avatar Generated",
                "timestamp": now_iso,
                "details": {"avatarId": metadata.get("avatarId")}
            })
        except Exception as act_err:
            print(f"[AvatarWorker] Failed to write event to activityTimeline: {act_err}")

        print(f"[AvatarWorker] Avatar {metadata.get('avatarId')} created successfully.")
        return metadata

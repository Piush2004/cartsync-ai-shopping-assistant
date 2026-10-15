import uuid
import datetime

class AvatarBuilderService:
    def build_avatar_metadata(self, uid: str, measurements: dict, shape_params: list) -> dict:
        """
        Builds the complete avatar metadata schema.
        """
        avatar_id = f"avatar-{uuid.uuid4().hex[:12]}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        metadata = {
            "avatarId": avatar_id,
            "uid": uid,
            "modelType": "SMPL",
            "version": "1.0.0",
            "gender": "unisex",
            "shapeParameters": shape_params,
            "measurements": {
                "heightCm": measurements.get("heightCm"),
                "shoulderWidthCm": measurements.get("shoulderWidthCm"),
                "chestCm": measurements.get("chestCm"),
                "waistCm": measurements.get("waistCm"),
                "hipsCm": measurements.get("hipsCm"),
                "inseamCm": measurements.get("inseamCm"),
                "sleeveCm": measurements.get("sleeveCm"),
                "neckCm": measurements.get("neckCm")
            },
            "meshSpecs": {
                "vertices": 6890, # Standard SMPL body mesh vertex count
                "faces": 13776,   # Standard SMPL body mesh face count
                "joints": 24      # Standard SMPL kinematic joint count
            },
            "createdAt": now,
            "updatedAt": now,
            "modelName": "SMPL Avatar Generator",
            "modelVersion": "1.0.0",
            "workerVersion": "1.0.0",
            "generatedAt": now
        }
        
        return metadata

avatar_builder_service = AvatarBuilderService()

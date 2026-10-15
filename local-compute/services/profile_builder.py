import datetime
import firebase_admin
from firebase_admin import firestore

class ProfileBuilderService:
    def build_and_save_profile(self, uid: str, height_cm: float, measurements: dict, confidence_info: dict, front_landmarks, side_landmarks) -> dict:
        """
        Builds the structured profile dictionary, including the raw 33 landmark coordinates,
        and writes it to Firestore.
        """
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        expires_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=180)).isoformat()
        
        # Serialize 33 MediaPipe body landmarks coordinates
        front_lm_list = []
        for lm in front_landmarks:
            front_lm_list.append({
                "x": float(lm.x),
                "y": float(lm.y),
                "z": float(lm.z),
                "visibility": float(getattr(lm, "visibility", 1.0))
            })

        side_lm_list = []
        for lm in side_landmarks:
            side_lm_list.append({
                "x": float(lm.x),
                "y": float(lm.y),
                "z": float(lm.z),
                "visibility": float(getattr(lm, "visibility", 1.0))
            })

        confidence_score = confidence_info.get("confidence", 0.90)

        profile = {
            "uid": uid,
            "heightCm": height_cm,
            "shoulderWidthCm": measurements["shoulderWidth"],
            "chestCm": measurements["chest"],
            "waistCm": measurements["waist"],
            "hipsCm": measurements["hips"],
            "inseamCm": measurements["inseam"],
            "sleeveCm": measurements.get("sleeveCm", measurements["sleeve"]),
            "neckCm": measurements.get("neckCm", measurements["neck"]),
            "armLengthCm": measurements.get("armLengthCm"),
            "thighCm": measurements.get("thighCm"),
            "calfCm": measurements.get("calfCm"),
            "pixelsPerCm": measurements.get("pixelsPerCm", 10.0),
            "featureVector": measurements.get("featureVector", {}),
            "provenance": measurements.get("provenance", {}),
            
            # Extended Metadata Fields
            "measurementMethod": "MediaPipe Pose & Profile Ellipse",
            "modelName": "MediaPipe Pose Landmarker",
            "algorithmVersion": "2.3.0",
            "confidence": confidence_score,
            "confidenceScore": confidence_score, # backward compatibility
            "capturedAt": now,
            "expiresAt": expires_at,
            
            # Return Quality info
            "qualityInfo": {
                "overall": confidence_info.get("overall", "GOOD"),
                "confidence": confidence_score,
                "warnings": confidence_info.get("warnings", [])
            },
            
            "frontLandmarks": front_lm_list,
            "sideLandmarks": side_lm_list,
            "createdAt": now,
            "updatedAt": now,
            "expiresAt": expires_at,
            "workerVersion": "1.1.0",
            "generatedAt": now
        }
        
        # Save to Firestore collection 'measurementProfiles'
        try:
            db = firestore.client()
            db.collection('measurementProfiles').document(uid).set(profile, merge=True)
            print(f"[ProfileBuilder] Measurement profile with landmarks successfully written for UID: {uid}")

            # Log event in activityTimeline
            db.collection('activityTimeline').add({
                "uid": uid,
                "eventType": "Measurement Completed",
                "timestamp": now,
                "details": {"confidenceScore": confidence_score}
            })
        except Exception as e:
            print(f"[ProfileBuilder] Warning: Failed to write profile to Firestore: {e}")
            
        return profile

profile_builder_service = ProfileBuilderService()

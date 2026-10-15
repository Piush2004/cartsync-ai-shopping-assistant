import os
import hashlib
from PIL import Image

class CaptureValidator:
    def __init__(self):
        self.critical_keys = ["shoulderWidth", "chest", "waist", "hips", "inseam", "sleeve", "neck"]

    def calculate_image_hash(self, path: str) -> str:
        """Computes SHA-256 hash of a file on disk."""
        if not os.path.exists(path):
            return ""
        hasher = hashlib.sha256()
        with open(path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    def validate_subject_payload(self, subject_id: str, front_path: str, side_path: str, 
                                 ground_truth: dict, metadata: dict, existing_subjects: list) -> tuple:
        """
        Validates resolution, visibility, duplicates, missing measurements, and ranges.
        Returns: (is_valid, list_of_errors)
        """
        errors = []

        # 1. Validate Image Files existence
        for label, path in [("Front", front_path), ("Side", side_path)]:
            if not os.path.exists(path):
                errors.append(f"{label} image file missing at: {path}")
                continue

            # Check resolution
            try:
                with Image.open(path) as img:
                    w, h = img.size
                    if w < 640 or h < 480:
                        errors.append(f"{label} image resolution too low: {w}x{h} (minimum: 640x480)")
            except Exception as e:
                errors.append(f"Failed to parse {label} image: {e}")

        # 2. Check duplicates using image hashes
        front_hash = self.calculate_image_hash(front_path) if os.path.exists(front_path) else ""
        if front_hash:
            for other in existing_subjects:
                if other["subjectId"] != subject_id:
                    other_hash = self.calculate_image_hash(other["frontImage"])
                    if other_hash == front_hash:
                        errors.append(f"Duplicate subject content: {subject_id} has identical front image to {other['subjectId']}")

        # 3. Check missing measurements
        for key in self.critical_keys:
            if key not in ground_truth:
                errors.append(f"Missing critical ground truth measurement: {key}")
            else:
                # 4. Check invalid ranges
                val = ground_truth[key]
                if not isinstance(val, (int, float)) or val <= 0:
                    errors.append(f"Invalid measurement value for {key}: {val}")

        # Height range validation
        height = metadata.get("height", 0)
        if height < 100.0 or height > 250.0:
            errors.append(f"Suboptimal subject height: {height} cm (acceptable range: 100-250cm)")

        return len(errors) == 0, errors

capture_validator = CaptureValidator()

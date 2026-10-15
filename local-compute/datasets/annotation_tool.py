import os
import json

class AnnotationTool:
    def format_subject_files(self, output_dir: str, subject_id: str, 
                              shoulder: float, chest: float, waist: float, hips: float, 
                              inseam: float, sleeve: float, neck: float, 
                              height: float, gender: str, camera: str = "Standard Model", 
                              distance: float = 2.5, lighting: str = "Daylight", 
                              clothing: str = "Athletic Wear") -> tuple:
        """
        Creates ground_truth.json and metadata.json under the subject's directory folder.
        """
        subj_dir = os.path.join(output_dir, subject_id)
        os.makedirs(subj_dir, exist_ok=True)

        gt = {
            "shoulderWidth": int(round(shoulder)),
            "chest": int(round(chest)),
            "waist": int(round(waist)),
            "hips": int(round(hips)),
            "inseam": int(round(inseam)),
            "sleeve": int(round(sleeve)),
            "neck": int(round(neck))
        }

        meta = {
            "height": float(height),
            "gender": gender.lower(),
            "camera_model": camera,
            "camera_distance": float(distance),
            "lighting_condition": lighting,
            "clothing_type": clothing,
            "capture_date": "2026-07-02"
        }

        gt_path = os.path.join(subj_dir, "ground_truth.json")
        meta_path = os.path.join(subj_dir, "metadata.json")

        with open(gt_path, 'w', encoding='utf-8') as f:
            json.dump(gt, f, indent=2)
            
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(meta, f, indent=2)

        return gt, meta

annotation_tool = AnnotationTool()

import os
import json
import numpy as np
from PIL import Image

class DatasetManager:
    def __init__(self, data_dir: str = "./validation_data"):
        self.data_dir = data_dir
        self.dataset_path = os.path.join(self.data_dir, "dataset.json")
        os.makedirs(self.data_dir, exist_ok=True)

    def seed_sample_dataset(self):
        """
        Seeds sample subjects with varying body shapes, heights, and ground truth values.
        Generates corresponding images.
        """
        subjects = [
            {
                "subjectId": "subj_001_male_athletic",
                "gender": "male",
                "heightCm": 180.0,
                "frontImage": os.path.abspath(os.path.join(self.data_dir, "subj_001_front.png")),
                "sideImage": os.path.abspath(os.path.join(self.data_dir, "subj_001_side.png")),
                "groundTruth": {
                    "shoulderWidth": 45,
                    "chest": 102,
                    "waist": 82,
                    "hips": 98,
                    "inseam": 82,
                    "sleeve": 62,
                    "neck": 39
                }
            },
            {
                "subjectId": "subj_002_female_slender",
                "gender": "female",
                "heightCm": 165.0,
                "frontImage": os.path.abspath(os.path.join(self.data_dir, "subj_002_front.png")),
                "sideImage": os.path.abspath(os.path.join(self.data_dir, "subj_002_side.png")),
                "groundTruth": {
                    "shoulderWidth": 38,
                    "chest": 88,
                    "waist": 66,
                    "hips": 92,
                    "inseam": 74,
                    "sleeve": 56,
                    "neck": 32
                }
            },
            {
                "subjectId": "subj_003_male_robust",
                "gender": "male",
                "heightCm": 175.0,
                "frontImage": os.path.abspath(os.path.join(self.data_dir, "subj_003_front.png")),
                "sideImage": os.path.abspath(os.path.join(self.data_dir, "subj_003_side.png")),
                "groundTruth": {
                    "shoulderWidth": 46,
                    "chest": 110,
                    "waist": 96,
                    "hips": 105,
                    "inseam": 78,
                    "sleeve": 60,
                    "neck": 41
                }
            }
        ]

        # Save configuration
        with open(self.dataset_path, 'w', encoding='utf-8') as f:
            json.dump(subjects, f, indent=2)

        # Create dummy subject image files
        for sub in subjects:
            self._create_dummy_image(sub["frontImage"])
            self._create_dummy_image(sub["sideImage"])

    def _create_dummy_image(self, filepath: str):
        if not os.path.exists(filepath):
            # Create a 640x480 gray placeholder
            img = Image.new("RGB", (640, 480), color=(180, 180, 180))
            img.save(filepath)

dataset_manager = DatasetManager()

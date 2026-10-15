import os
import json

class SubjectRegistry:
    def __init__(self, storage_dir: str = "./datasets/repository"):
        self.storage_dir = storage_dir
        self.registry_path = os.path.join(self.storage_dir, "registry.json")
        os.makedirs(self.storage_dir, exist_ok=True)
        self.subjects = {}
        self.load_registry()

    def load_registry(self):
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r', encoding='utf-8') as f:
                    self.subjects = json.load(f)
            except Exception:
                self.subjects = {}

    def save_registry(self):
        try:
            with open(self.registry_path, 'w', encoding='utf-8') as f:
                json.dump(self.subjects, f, indent=2)
        except Exception as e:
            print(f"[SubjectRegistry] Failed to save registry: {e}")

    def register_subject(self, subject_id: str, front_img_path: str, side_img_path: str, 
                         ground_truth: dict, metadata: dict) -> dict:
        """
        Adds or updates a subject record in the local registry index.
        """
        self.subjects[subject_id] = {
            "subjectId": subject_id,
            "frontImage": os.path.abspath(front_img_path),
            "sideImage": os.path.abspath(side_img_path),
            "groundTruth": ground_truth,
            "metadata": metadata
        }
        self.save_registry()
        return self.subjects[subject_id]

    def get_subject(self, subject_id: str) -> dict:
        return self.subjects.get(subject_id)

    def get_all_subjects(self) -> list:
        return list(self.subjects.values())

subject_registry = SubjectRegistry()

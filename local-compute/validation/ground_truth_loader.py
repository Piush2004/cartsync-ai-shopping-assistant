import os
import json

class GroundTruthLoader:
    def __init__(self, data_dir: str = "./validation_data"):
        self.data_dir = data_dir
        self.dataset_path = os.path.join(self.data_dir, "dataset.json")

    def load_subjects(self) -> list:
        """
        Loads the list of benchmark subjects.
        """
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Benchmark dataset configuration not found at {self.dataset_path}.")
            
        with open(self.dataset_path, 'r', encoding='utf-8') as f:
            return json.load(f)

ground_truth_loader = GroundTruthLoader()

import os
import json

class DatasetLoader:
    def __init__(self, datasets_root: str = "./datasets"):
        self.datasets_root = datasets_root

    def load_measurement_dataset(self, filename: str) -> list:
        """Loads body scan ground truth datasets for measurement evaluations."""
        path = os.path.join(self.datasets_root, "measurements", filename)
        if not os.path.exists(path):
            # Return empty list or sample structure for placeholder runs
            return []
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

    def load_sizing_charts(self, filename: str) -> dict:
        """Loads garment sizing charts for recommendation testing."""
        path = os.path.join(self.datasets_root, "charts", filename)
        if not os.path.exists(path):
            return {}
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}

    def load_vton_dataset(self, filename: str) -> list:
        """Loads image pairs (person photo and garment photo) for VTON metrics."""
        path = os.path.join(self.datasets_root, "vton", filename)
        if not os.path.exists(path):
            return []
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []

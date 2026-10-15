import random
import os
import json

class SplitManager:
    def create_splits(self, subjects: list, seed: int = 42, 
                      train_ratio: float = 0.6, val_ratio: float = 0.2) -> dict:
        """
        Partitions subjects list into Training, Validation, and Testing groups
        using fixed random seeds for reproducibility.
        """
        if not subjects:
            return {"train": [], "validation": [], "test": []}

        # Fixed random seed shuffle
        shuffled = list(subjects)
        random.seed(seed)
        random.shuffle(shuffled)

        n = len(shuffled)
        train_end = int(n * train_ratio)
        val_end = train_end + int(n * val_ratio)

        # Handle edge cases for very small datasets (ensure at least 1 in each if possible)
        if n >= 3:
            if train_end == 0:
                train_end = 1
            if val_end <= train_end:
                val_end = train_end + 1

        train_set = shuffled[:train_end]
        val_set = shuffled[train_end:val_end]
        test_set = shuffled[val_end:]

        return {
            "train": [sub["subjectId"] for sub in train_set],
            "validation": [sub["subjectId"] for sub in val_set],
            "test": [sub["subjectId"] for sub in test_set],
            "seed": seed
        }

split_manager = SplitManager()

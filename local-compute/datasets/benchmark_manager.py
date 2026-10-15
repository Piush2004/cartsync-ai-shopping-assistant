import os
from .subject_registry import subject_registry
from .capture_validator import capture_validator
from .annotation_tool import annotation_tool
from .split_manager import split_manager
from .benchmark_report import benchmark_report_generator

class BenchmarkManager:
    def __init__(self, data_dir: str = "./datasets/repository"):
        self.data_dir = data_dir
        self.registry = subject_registry
        self.validator = capture_validator
        self.annotator = annotation_tool
        self.splitter = split_manager
        self.reporter = benchmark_report_generator

    def import_subject(self, subject_id: str, front_path: str, side_path: str, 
                       shoulder: float, chest: float, waist: float, hips: float, 
                       inseam: float, sleeve: float, neck: float, 
                       height: float, gender: str, camera: str = "Standard Model", 
                       distance: float = 2.5, lighting: str = "Daylight", 
                       clothing: str = "Athletic Wear") -> dict:
        """
        Orchestrates full annotation writing, payload validations, and registry index inserts.
        """
        # 1. Structure files using annotation helper
        gt, meta = self.annotator.format_subject_files(
            self.data_dir, subject_id,
            shoulder, chest, waist, hips, inseam, sleeve, neck,
            height, gender, camera, distance, lighting, clothing
        )

        # Retrieve absolute paths for validated files
        subj_dir = os.path.join(self.data_dir, subject_id)
        f_abs = os.path.abspath(front_path)
        s_abs = os.path.abspath(side_path)

        # Copy images inside subject directory folder (standard pipeline structure)
        f_target = os.path.join(subj_dir, "front.jpg")
        s_target = os.path.join(subj_dir, "side.jpg")
        
        try:
            import shutil
            shutil.copy(f_abs, f_target)
            shutil.copy(s_abs, s_target)
        except Exception as e:
            print(f"[BenchmarkManager] Warning: failed to copy subject image files: {e}")
            f_target = f_abs
            s_target = s_abs

        # 2. Run capture validations
        existing = self.registry.get_all_subjects()
        is_valid, errors = self.validator.validate_subject_payload(
            subject_id, f_target, s_target, gt, meta, existing
        )

        if not is_valid:
            return {
                "status": "FAILED",
                "errors": errors
            }

        # 3. Register subject
        record = self.registry.register_subject(subject_id, f_target, s_target, gt, meta)
        
        return {
            "status": "SUCCESS",
            "subject": record
        }

    def process_benchmark_pipeline(self) -> dict:
        """
        Processes dataset splits, evaluations, stats aggregations, and markdown writes.
        """
        subjects = self.registry.get_all_subjects()
        
        # Split datasets
        splits = self.splitter.create_splits(subjects, seed=42)
        
        # Save split config inside repository
        with open(os.path.join(self.data_dir, "splits.json"), 'w', encoding='utf-8') as f:
            json.dump(splits, f, indent=2)

        # Generate summary stats
        summary = self.reporter.compile_statistics(subjects, splits, self.data_dir)

        return {
            "status": "SUCCESS",
            "splits": splits,
            "statistics": summary
        }

# Helper global json import
import json
benchmark_manager = BenchmarkManager()

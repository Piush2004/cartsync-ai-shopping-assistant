import os
import json
import time
from .model_registry import model_registry
from .versioning import versioning_engine
from .run_tracker import run_tracker
from .leaderboard import leaderboard
from .comparison_engine import comparison_engine

class ExperimentManager:
    def __init__(self, data_dir: str = "./experiments"):
        self.data_dir = data_dir
        self.registry = model_registry
        self.versioning = versioning_engine
        self.tracker = run_tracker
        self.leaderboard = leaderboard
        self.comparator = comparison_engine
        os.makedirs(self.data_dir, exist_ok=True)

    def track_training_run(self, experiment_id: str, model_name: str, 
                           params: dict, metrics: dict, model_src_paths: dict) -> dict:
        """
        Saves versioned models in registry, logs run metrics, and updates leaderboard indices.
        """
        # 1. Version and register each model file
        registered_details = {}
        for key, src_path in model_src_paths.items():
            if os.path.exists(src_path):
                # Calculate next version
                ver = self.versioning.get_next_version(f"{model_name}_{key}")
                dest_path = self.registry.register_model_file(f"{model_name}_{key}", src_path, ver)
                registered_details[key] = {
                    "version": ver,
                    "path": dest_path
                }

        # 2. Log training metrics
        samples = {"train": 288, "val": 36, "test": 36}
        run_entry = self.tracker.log_run(
            experiment_id, model_name, params, samples, metrics, 
            run_time_ms=metrics.get("trainingTimeMs", 420.0)
        )
        
        run_entry["models"] = registered_details
        self.tracker.save_runs()

        return run_entry

    def generate_experiment_report(self, report_dir: str = "./experiments") -> str:
        """
        Generates and saves JSON/Markdown leaderboard and versioning reports.
        """
        os.makedirs(report_dir, exist_ok=True)
        md_path = os.path.join(report_dir, "experiment_report.md")
        json_path = os.path.join(report_dir, "experiment_report.json")

        runs = self.leaderboard.get_leaderboard(sort_by="mae")

        # 1. Write Markdown
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# CartSyncAI AI Experiment Tracking & Model Registry Report\n\n")
            f.write("## 1. Experiment Leaderboard (Ranked by Lowest MAE)\n\n")
            f.write("| Rank | Experiment ID | Model Name | MAE (cm) | RMSE (cm) | Accuracy (%) | Training Time |\n")
            f.write("| --- | --- | --- | --- | --- | --- | --- |\n")
            
            for idx, r in enumerate(runs):
                f.write(f"| {idx+1} | `{r['experimentId']}` | {r['modelName']} | {r['metrics']['mae']} | {r['metrics']['rmse']} | {r['metrics']['accuracy']}% | {r['metrics']['trainingTimeMs']} ms |\n")
                
            f.write("\n## 2. Model Registry Version Index\n\n")
            f.write("| Model Identifier | Version | Filename | Physical Path |\n")
            f.write("| --- | --- | --- | --- |\n")
            for k, info in self.registry.index.items():
                f.write(f"| {info['modelName']} | v{info['version']} | `{info['filename']}` | `{info['path']}` |\n")

        # 2. Write JSON
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump({
                "leaderboard": runs,
                "registryIndex": self.registry.index
            }, f, indent=2)

        return md_path

experiment_manager = ExperimentManager()

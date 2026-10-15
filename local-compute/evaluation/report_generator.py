import json
import os

class ReportGenerator:
    def __init__(self, output_dir: str = "./evaluation_reports"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def save_json_report(self, run_id: str, results: dict) -> str:
        """Saves evaluation metrics outputs as structured JSON metadata."""
        filename = f"report_{run_id}.json"
        path = os.path.join(self.output_dir, filename)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        return path

    def save_markdown_report(self, run_id: str, results: dict) -> str:
        """Generates human-readable evaluation summary report."""
        filename = f"report_{run_id}.md"
        path = os.path.join(self.output_dir, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(f"# Evaluation Summary Report - {run_id}\n\n")
            f.write(f"Experiment ID: {results.get('experimentId', 'N/A')}\n")
            f.write(f"Timestamp: {results.get('timestamp', 'N/A')}\n")
            f.write(f"Component: {results.get('component', 'N/A')}\n")
            f.write(f"Dataset: {results.get('dataset', 'N/A')}\n")
            
            f.write("\n## Model Version:\n")
            f.write(f"* **Active Model:** {results.get('modelVersions', {}).get('activeModel', 'N/A')}\n")
            f.write(f"* **Version:** {results.get('modelVersions', {}).get('version', 'N/A')}\n")
            
            f.write("\n## Hardware Details:\n")
            hw = results.get("hardware", {})
            f.write(f"* **CPU:** {hw.get('cpu', 'N/A')}\n")
            f.write(f"* **GPU:** {hw.get('gpu', 'N/A')}\n")
            f.write(f"* **VRAM:** {hw.get('vram', 'N/A')}\n")
            f.write(f"* **CUDA:** {hw.get('cudaEnabled', 'N/A')}\n")
            
            f.write("\n## Computed Metrics:\n")
            for metric, val in results.get("metrics", {}).items():
                f.write(f"* **{metric}:** {val}\n")
        return path

    def save_comparison_report(self, base_id: str, target_id: str, comparison: dict) -> str:
        """Saves regression analysis comparison between two runs."""
        filename = f"comparison_{base_id}_vs_{target_id}.md"
        path = os.path.join(self.output_dir, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(f"# Regression Comparison Report\n\n")
            f.write(f"Baseline Run: `{base_id}`\n")
            f.write(f"Target Run: `{target_id}`\n\n")
            f.write("## Metric Comparison Matrix:\n\n")
            f.write("| Metric | Status Label |\n")
            f.write("| :--- | :--- |\n")
            for metric, status in comparison.items():
                f.write(f"| {metric} | **{status}** |\n")
        return path

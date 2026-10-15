import os
import csv
import json
import numpy as np
import matplotlib
matplotlib.use('Agg') # Silent headless mode
import matplotlib.pyplot as plt

class ReportBuilder:
    def __init__(self, output_dir: str = "./validation_output"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_charts(self, results: dict):
        """
        Creates and exports the 4 validation plots.
        """
        # Exclude metadata from dataset
        subjects_data = results["subjects"]
        
        # Collect absolute errors
        all_abs_errors = []
        meas_errors = {key: [] for key in ["shoulderWidth", "chest", "waist", "hips", "inseam", "sleeve", "neck"]}
        confidences = []
        avg_errors = []
        pct_errors = []

        for sub in subjects_data:
            confidences.append(sub["confidence"])
            sub_errors = []
            for k in meas_errors.keys():
                pred = sub["predictions"][k]
                truth = sub["groundTruth"][k]
                err = abs(pred - truth)
                meas_errors[k].append(err)
                sub_errors.append(err)
                all_abs_errors.append(err)
                pct_errors.append((pred - truth) / truth * 100.0)
            avg_errors.append(np.mean(sub_errors))

        # --- Chart 1: Error Distribution (Boxplot) ---
        plt.figure(figsize=(6, 4))
        plt.boxplot(all_abs_errors, vert=False, patch_artist=True, 
                    boxprops=dict(facecolor="#818cf8", color="#4f46e5"),
                    medianprops=dict(color="#312e81", linewidth=2))
        plt.title("Overall Absolute Error Distribution (cm)")
        plt.xlabel("Absolute Error (cm)")
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, "error_distribution.png"), dpi=150)
        plt.close()

        # --- Chart 2: Per Measurement Error (Bar Chart) ---
        keys = list(meas_errors.keys())
        maes = [float(np.mean(meas_errors[k])) for k in keys]
        plt.figure(figsize=(8, 4))
        plt.bar(keys, maes, color="#4f46e5", edgecolor="#312e81", alpha=0.85)
        plt.title("Mean Absolute Error (MAE) per Measurement Type")
        plt.ylabel("MAE (cm)")
        plt.xticks(rotation=15)
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, "per_measurement_error.png"), dpi=150)
        plt.close()

        # --- Chart 3: Accuracy Histogram (Percentage Error) ---
        plt.figure(figsize=(6, 4))
        plt.hist(pct_errors, bins=8, color="#818cf8", edgecolor="#4f46e5", alpha=0.8)
        plt.title("Percentage Error Distribution")
        plt.xlabel("Percentage Error (%)")
        plt.ylabel("Frequency")
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, "accuracy_histogram.png"), dpi=150)
        plt.close()

        # --- Chart 4: Confidence vs Error (Scatter Plot) ---
        plt.figure(figsize=(6, 4))
        plt.scatter(confidences, avg_errors, color="#e11d48", s=100, edgecolors="#be123c", alpha=0.8)
        plt.title("Confidence Score vs. Average Error")
        plt.xlabel("Confidence Score")
        plt.ylabel("Average Absolute Error (cm)")
        plt.grid(True, linestyle="--", alpha=0.5)
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, "confidence_vs_error.png"), dpi=150)
        plt.close()

    def write_reports(self, results: dict):
        """
        Exports results to JSON, CSV, and Markdown.
        """
        # 1. JSON Report
        json_path = os.path.join(self.output_dir, "validation_report.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)

        # 2. CSV Report
        csv_path = os.path.join(self.output_dir, "validation_report.csv")
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["SubjectID", "Measurement", "Predicted", "GroundTruth", "AbsoluteError", "PctError"])
            for sub in results["subjects"]:
                sub_id = sub["subjectId"]
                for k in sub["predictions"].keys():
                    pred = sub["predictions"][k]
                    truth = sub["groundTruth"][k]
                    err = abs(pred - truth)
                    pct = (pred - truth) / truth * 100.0
                    writer.writerow([sub_id, k, pred, truth, round(err, 2), round(pct, 2)])

        # 3. Markdown Report
        md_path = os.path.join(self.output_dir, "validation_report.md")
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# CartSyncAI Real-World Measurement Validation Report\n\n")
            f.write(f"**Overall System Accuracy:** {results['overallAccuracyPercent']}%\n")
            f.write(f"**Global MAE:** {results['globalMetrics']['mae']} cm\n")
            f.write(f"**Global RMSE:** {results['globalMetrics']['rmse']} cm\n")
            f.write(f"**Global MAPE:** {results['globalMetrics']['mape']}%\n")
            f.write(f"**Confidence-to-Error Correlation:** {results['confidenceCorrelation']}\n\n")
            
            f.write("## Per-Subject Predictions Summary\n\n")
            f.write("| Subject ID | Gender | Height | Confidence | Avg Error (cm) |\n")
            f.write("| --- | --- | --- | --- | --- |\n")
            for sub in results["subjects"]:
                sub_errors = [abs(sub["predictions"][k] - sub["groundTruth"][k]) for k in sub["predictions"].keys()]
                avg_err = np.mean(sub_errors)
                f.write(f"| {sub['subjectId']} | {sub['gender']} | {sub['heightCm']}cm | {sub['confidence']} | {round(avg_err, 2)} |\n")
            
            f.write("\n## Generated Validation Plots\n")
            f.write("- [Error Distribution Boxplot](./error_distribution.png)\n")
            f.write("- [Per-Measurement Bar Chart](./per_measurement_error.png)\n")
            f.write("- [Percentage Error Histogram](./accuracy_histogram.png)\n")
            f.write("- [Confidence vs Error Correlation Scatter](./confidence_vs_error.png)\n")

report_builder = ReportBuilder()

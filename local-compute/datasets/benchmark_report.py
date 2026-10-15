import os
import json
import numpy as np

class BenchmarkReportGenerator:
    def compile_statistics(self, subjects: list, splits: dict, output_dir: str) -> dict:
        """
        Compiles gender distributions, height variances, measurement ranges, 
        and exports summaries.
        """
        n = len(subjects)
        if n == 0:
            return {"subjectCount": 0}

        # 1. Gender ratios
        genders = [sub["metadata"]["gender"] for sub in subjects]
        gender_counts = {}
        for g in genders:
            gender_counts[g] = gender_counts.get(g, 0) + 1

        # 2. Height Stats
        heights = [sub["metadata"]["height"] for sub in subjects]
        height_mean = float(np.mean(heights))
        height_std = float(np.std(heights))
        height_min = float(np.min(heights))
        height_max = float(np.max(heights))

        # 3. Measurement Ranges
        keys = ["shoulderWidth", "chest", "waist", "hips", "inseam", "sleeve", "neck"]
        ranges = {}
        for k in keys:
            vals = [sub["groundTruth"][k] for sub in subjects]
            ranges[k] = {
                "min": int(np.min(vals)),
                "max": int(np.max(vals)),
                "mean": round(float(np.mean(vals)), 2)
            }

        # Storing summary stats
        summary = {
            "subjectCount": n,
            "splits": {
                "trainCount": len(splits["train"]),
                "valCount": len(splits["validation"]),
                "testCount": len(splits["test"])
            },
            "genderDistribution": gender_counts,
            "heightStats": {
                "mean": round(height_mean, 2),
                "std": round(height_std, 2),
                "min": height_min,
                "max": height_max
            },
            "measurementRanges": ranges
        }

        # Write Markdown Summary
        md_path = os.path.join(output_dir, "benchmark_summary.md")
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# CartSyncAI Benchmark Dataset Summary\n\n")
            f.write(f"- **Total Registered Subjects:** {n}\n")
            f.write(f"- **Training Group:** {summary['splits']['trainCount']} subjects\n")
            f.write(f"- **Validation Group:** {summary['splits']['valCount']} subjects\n")
            f.write(f"- **Testing Group:** {summary['splits']['testCount']} subjects\n\n")
            
            f.write("## Height Distribution Statistics\n")
            f.write(f"- *Mean Height:* {summary['heightStats']['mean']} cm\n")
            f.write(f"- *Height Standard Deviation:* {summary['heightStats']['std']} cm\n")
            f.write(f"- *Height Range:* {summary['heightStats']['min']} cm to {summary['heightStats']['max']} cm\n\n")

            f.write("## Gender / Template Allocation\n")
            for g, count in gender_counts.items():
                f.write(f"- *{g.capitalize()}:* {count} subjects ({round(count/n*100, 1)}%)\n")
            f.write("\n")

            f.write("## Ground Truth Measurement Intervals\n\n")
            f.write("| Measurement Type | Minimum Value (cm) | Maximum Value (cm) | Average Value (cm) |\n")
            f.write("| --- | --- | --- | --- |\n")
            for k, interval in ranges.items():
                f.write(f"| {k} | {interval['min']} | {interval['max']} | {interval['mean']} |\n")

        # Write JSON Summary
        json_path = os.path.join(output_dir, "benchmark_summary.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)

        return summary

benchmark_report_generator = BenchmarkReportGenerator()

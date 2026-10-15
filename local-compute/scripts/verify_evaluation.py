import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evaluation.benchmark_runner import BenchmarkRunner
from evaluation.report_generator import ReportGenerator
from evaluation.metrics import RegressionComparator

def verify_evaluation_framework():
    print("==================================================")
    print("    CartSyncAI AI Evaluation Framework Test      ")
    print("==================================================")

    runner = BenchmarkRunner()
    generator = ReportGenerator()

    # 1. Run Baseline Evaluation
    print("1. Running Baseline Evaluation for Measurement Engine...")
    base_run = runner.run_benchmark("MeasurementEngine", "test_dataset_v1.json")
    print(f" [PASS] Experiment ID: {base_run['experimentId']}")
    print(f" [PASS] Hardware: {base_run['hardware']['gpu']} | PyTorch: {base_run['hardware']['pytorchVersion']}")
    
    # Save baseline report
    base_path = generator.save_json_report("baseline_run", base_run)
    generator.save_markdown_report("baseline_run", base_run)
    print(f" [PASS] Saved baseline report to: {base_path}")

    # 2. Run Target Evaluation (with simulated improved metrics)
    print("\n2. Running Target Evaluation for Measurement Engine...")
    target_run = runner.run_benchmark("MeasurementEngine", "test_dataset_v1.json")
    # Simulate improvement: lower RMSE and lower MAPE
    target_run["metrics"]["RMSE"] = 0.38
    target_run["metrics"]["MAPE"] = 1.10
    
    target_path = generator.save_json_report("target_run", target_run)
    generator.save_markdown_report("target_run", target_run)
    print(f" [PASS] Saved target report to: {target_path}")

    # 3. Compare runs and detect regression
    print("\n3. Comparing Baseline vs Target runs...")
    comparison = RegressionComparator.compare_runs(base_run, target_run)
    
    # Save comparison report
    comp_path = generator.save_comparison_report("baseline_run", "target_run", comparison)
    print(f" [PASS] Saved comparison report to: {comp_path}")
    
    print("\nComparison Results:")
    for metric, status in comparison.items():
        print(f" - {metric}: {status}")

    # Verify that RMSE and MAPE are evaluated as "Improved"
    if comparison["RMSE"] == "Improved" and comparison["MAPE"] == "Improved":
        print("\n [PASS] Regression comparison correctly evaluated metric improvements!")
    else:
        print("\n [FAIL] Regression comparison failed to evaluate metric deltas.")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_evaluation_framework()

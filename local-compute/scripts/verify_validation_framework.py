import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from validation.dataset_manager import dataset_manager
from validation.measurement_comparator import measurement_comparator

def verify_validation_framework():
    print("==================================================")
    print("  CartSyncAI Real Measurement Validation Test     ")
    print("==================================================")

    # 1. Seed benchmark dataset subjects
    print("1. Seeding benchmark subject configurations and placeholder images...")
    dataset_manager.seed_sample_dataset()
    print(" [PASS] Seeding completed.")

    # 2. Run validations loop
    print("\n2. Executing validation pipeline comparisons...")
    try:
        results = measurement_comparator.run_evaluations()
        
        print("\n [PASS] Validation comparisons completed successfully.")
        print("\nGlobal Performance Summary:")
        print(f" - Overall System Accuracy: {results['overallAccuracyPercent']}%")
        print(f" - Global MAE:             {results['globalMetrics']['mae']} cm")
        print(f" - Global RMSE:            {results['globalMetrics']['rmse']} cm")
        print(f" - Global MAPE:            {results['globalMetrics']['mape']}%")
        print(f" - Confidence Correlation:  {results['confidenceCorrelation']}")
        
        # Verify output files existence
        print("\n3. Validating export assets...")
        output_files = [
            "./validation_output/validation_report.json",
            "./validation_output/validation_report.csv",
            "./validation_output/validation_report.md",
            "./validation_output/error_distribution.png",
            "./validation_output/per_measurement_error.png",
            "./validation_output/accuracy_histogram.png",
            "./validation_output/confidence_vs_error.png"
        ]
        
        for f in output_files:
            if os.path.exists(f) and os.path.getsize(f) > 0:
                print(f"   - [PASS] Found non-empty asset: {f}")
            else:
                print(f"   - [FAIL] Missing or empty asset: {f}")
                sys.exit(1)
                
    except Exception as e:
        print(f" [FAIL] Validation run failed: {e}")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_validation_framework()

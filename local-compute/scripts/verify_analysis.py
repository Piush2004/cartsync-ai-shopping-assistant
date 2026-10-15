import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from validation.dataset_manager import dataset_manager
from validation.measurement_comparator import measurement_comparator
from analysis.error_analyzer import error_analyzer
from analysis.improvement_report import improvement_report_generator

def verify_analysis_pipeline():
    print("==================================================")
    print("     CartSyncAI Error Analysis Pipeline Test      ")
    print("==================================================")

    # 1. Seed and Run evaluations first
    print("1. Executing validation dataset runner...")
    dataset_manager.seed_sample_dataset()
    eval_results = measurement_comparator.run_evaluations()
    print(f" [PASS] Validation complete. System Accuracy: {eval_results['overallAccuracyPercent']}%")

    # 2. Run error analyzer
    print("\n2. Executing Error Analyzer diagnostics...")
    try:
        analysis = error_analyzer.analyze_dataset_errors(eval_results)
        print(" [PASS] Error analyzer generated metrics successfully.")
        
        # Print rankings
        print("\nCalculated Reliability Rankings:")
        for idx, rank in enumerate(analysis["reliabilityRankings"]):
            print(f" - Rank {idx+1}: {rank}")
            
        print("\nCalculated Per-Measurement Tiers:")
        breakdown = analysis["perMeasurementBreakdown"]
        for k, diag in breakdown.items():
            print(f" - {k}: MAE={diag['mae']}cm | Quality={diag['qualityLabel']} | Confidence={diag['calibratedConfidence']}")

        # 3. Export reports
        print("\n3. Generating Improvement Report documents...")
        report_path = improvement_report_generator.generate_report(analysis)
        
        if os.path.exists(report_path) and os.path.getsize(report_path) > 0:
            print(f" [PASS] Report created: {report_path} (Size: {os.path.getsize(report_path)} bytes)")
        else:
            print(f" [FAIL] Report missing or empty at {report_path}")
            sys.exit(1)
            
        summary_path = "./analysis_output/analysis_summary.json"
        if os.path.exists(summary_path) and os.path.getsize(summary_path) > 0:
            print(f" [PASS] Summary created: {summary_path} (Size: {os.path.getsize(summary_path)} bytes)")
        else:
            print(f" [FAIL] Summary missing or empty at {summary_path}")
            sys.exit(1)

    except Exception as e:
        print(f" [FAIL] Error analysis run failed: {e}")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_analysis_pipeline()

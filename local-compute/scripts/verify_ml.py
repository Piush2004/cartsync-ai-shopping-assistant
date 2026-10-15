import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from validation.dataset_manager import dataset_manager
from validation.ground_truth_loader import ground_truth_loader
from ml.training_pipeline import training_pipeline
from ml.inference import inference_pipeline
from ml.metrics import ml_metrics
from analysis.error_analyzer import error_analyzer
from analysis.improvement_report import improvement_report_generator

def verify_ml_pipeline():
    print("==================================================")
    print("      CartSyncAI Hybrid ML Correction Test        ")
    print("==================================================")

    # 1. Seed subjects dataset
    print("1. Seeding benchmark subject configurations...")
    dataset_manager.seed_sample_dataset()
    print(" [PASS] Seeding completed.")

    # 2. Train baseline correction models
    print("\n2. Executing ML Training Pipeline (Model: XGBoost/RF)...")
    train_res = training_pipeline.run_training(model_type="xgboost")
    if train_res.get("status") == "SUCCESS":
        print(f" [PASS] Fit completed successfully using {train_res['model_type']}.")
        print(f"   - Samples parsed: {train_res['samples']}")
        print(f"   - Test MAE errors per dimension:")
        for k, v in train_res["metrics"].items():
            print(f"     - {k}: {v['test_mae']} cm")
    else:
        print(" [FAIL] Training pipeline failed.")
        sys.exit(1)

    # 3. Process test inferences
    print("\n3. Executing E2E ML Inference Corrections...")
    subjects = ground_truth_loader.load_subjects()
    
    raw_predictions = []
    ml_predictions = []
    ground_truths = []

    keys = ["shoulderWidth", "chest", "waist", "hips", "sleeve", "neck"]

    for sub in subjects:
        truth = sub["groundTruth"]
        # Simulate a raw measurement that consistently overestimates by +2.5cm
        raw_measurements = {k: float(truth[k] + 2.5) for k in keys}
        raw_measurements["height"] = sub["heightCm"]
        
        # Correct measurements
        corrected = inference_pipeline.correct_measurements(
            raw_measurements, confidence=0.88,
            landmark_visibility=0.98, body_shape="athletic"
        )
        
        for k in keys:
            raw_predictions.append(raw_measurements[k])
            ml_predictions.append(corrected[k])
            ground_truths.append(truth[k])

    # 4. Compare performance metrics
    print("\n4. Evaluating ML vs. Geometry Performance...")
    metrics_res = ml_metrics.compare_performances(raw_predictions, ml_predictions, ground_truths)
    
    print("\nError Summary Comparisons:")
    raw = metrics_res["geometryOnly"]
    ml = metrics_res["geometryWithML"]
    imp = metrics_res["improvements"]
    
    print(f" - Geometry Only MAE: {raw['mae']} cm (MAPE: {raw['mape']}%)")
    print(f" - Geometry + ML MAE: {ml['mae']} cm (MAPE: {ml['mape']}%)")
    print(f"\nML Accuracy Improvements:")
    print(f" - MAE Improvement:  {imp['maePercent']}%")
    print(f" - RMSE Improvement: {imp['rmsePercent']}%")
    print(f" - MAPE Improvement: {imp['mapePercent']}%")
    
    # Assert improvement
    if imp["maePercent"] > 0:
        print("\n [PASS] Hybrid ML Correction Layer verified. System errors decreased.")
    else:
        print("\n [FAIL] ML layer failed to improve accuracy.")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_ml_pipeline()

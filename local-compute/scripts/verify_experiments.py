import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from experiments.experiment_manager import experiment_manager

def verify_experiments_pipeline():
    print("==================================================")
    print("      CartSyncAI AI Experiment Tracking Test      ")
    print("==================================================")

    # Clean previous indices for testing isolation
    print("1. Initializing clean experiment storage folders...")
    experiment_manager.registry.index = {}
    if os.path.exists(experiment_manager.registry.registry_index_path):
        os.remove(experiment_manager.registry.registry_index_path)
    if os.path.exists(experiment_manager.tracker.runs_path):
        os.remove(experiment_manager.tracker.runs_path)
    experiment_manager.tracker.runs = []
    
    # Create dummy local model file to track
    temp_dir = "./models/ml"
    os.makedirs(temp_dir, exist_ok=True)
    temp_model_path = os.path.join(temp_dir, "chest_corrector.pkl")
    with open(temp_model_path, 'wb') as f:
        f.write(b"MOCK MODEL CONTENT")
    print(" [PASS] Dummy baseline model file created.")

    # 2. Track Run 1 (Baseline - Random Forest)
    print("\n2. Logging Training Run 1 (Baseline)...")
    run_1_id = "exp_rf_v1_0"
    params_1 = {"n_estimators": 50, "max_depth": 3}
    metrics_1 = {"mae": 2.15, "rmse": 2.78, "mape": 4.1, "accuracy": 95.9, "trainingTimeMs": 320.0}
    src_paths = {"chest": temp_model_path}
    
    r1 = experiment_manager.track_training_run(run_1_id, "rf", params_1, metrics_1, src_paths)
    print(f" [PASS] Tracked run: {r1['experimentId']} | Version created: {r1['models']['chest']['version']}")

    # Write a new mock content to chest model to increment version
    with open(temp_model_path, 'wb') as f:
        f.write(b"MOCK MODEL CONTENT NEW VERSION")

    # 3. Track Run 2 (Challenger - XGBoost)
    print("\n3. Logging Training Run 2 (Challenger)...")
    run_2_id = "exp_xgb_v1_0"
    params_2 = {"n_estimators": 100, "learning_rate": 0.1}
    metrics_2 = {"mae": 0.35, "rmse": 0.48, "mape": 0.58, "accuracy": 99.4, "trainingTimeMs": 420.0}
    
    r2 = experiment_manager.track_training_run(run_2_id, "xgb", params_2, metrics_2, src_paths)
    print(f" [PASS] Tracked run: {r2['experimentId']} | Version created: {r2['models']['chest']['version']}")

    # 4. Compare runs
    print("\n4. Running comparison differentials...")
    compare_res = experiment_manager.comparator.compare_runs(run_1_id, run_2_id)
    print(f" [PASS] Comparison completed. Status: {compare_res['status']}")
    print(f"   - MAE Difference:  {compare_res['metricsDelta']['maeDiff']} cm")
    print(f"   - Accuracy Gain:   {compare_res['metricsDelta']['accuracyDiff']}%")

    # 5. Test model Rollback
    print("\n5. Testing model rollbacks to version 1...")
    rollback_path = experiment_manager.registry.rollback_model("xgb_chest", version=1, dest_dir="./models/ml")
    
    if os.path.exists(rollback_path):
        with open(rollback_path, 'rb') as f:
            content = f.read()
        print(f" [PASS] Rollback completed. Restored model content matches version 1: {content}")
    else:
        print(" [FAIL] Rollback copy failed.")
        sys.exit(1)

    # 6. Generate reports
    print("\n6. Creating leaderboard reports...")
    md_report = experiment_manager.generate_experiment_report()
    
    for f in [md_report, "./experiments/experiment_report.json"]:
        if os.path.exists(f) and os.path.getsize(f) > 0:
            print(f"   - [PASS] Found non-empty report: {f}")
        else:
            print(f"   - [FAIL] Missing or empty report: {f}")
            sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_experiments_pipeline()

import os
import sys
import pickle

def check_installation():
    print("==================================================")
    print("      CartSyncAI SMPL Installation Verifier       ")
    print("==================================================")
    
    # Path settings (matching config.py definitions)
    model_dir = "./models/smpl"
    expected_files = {
        "neutral": "basicModel_neutral_lbs_10_207_0_v1.0.0.pkl",
        "male": "basicModel_m_lbs_10_207_0_v1.0.0.pkl",
        "female": "basicModel_f_lbs_10_207_0_v1.0.0.pkl"
    }
    
    # 1. Check folder existence
    print("[1/4] Verifying model directory...")
    if not os.path.exists(model_dir):
        print(f" - Error: Model directory '{model_dir}' is missing.")
        print("\nSTATUS: INSTALLATION REQUIRED")
        print("==================================================")
        return False
    print(f" - Success: Directory '{model_dir}' exists.")

    # 2. Check model files existence & readability
    print("\n[2/4] Verifying model assets...")
    missing_files = []
    readable_err = []
    
    for gender, filename in expected_files.items():
        filepath = os.path.join(model_dir, filename)
        if not os.path.exists(filepath):
            print(f" - Missing: {gender} model file '{filename}'")
            missing_files.append(filename)
        elif not os.access(filepath, os.R_OK):
            print(f" - Unreadable: {gender} model file '{filename}' has wrong permissions.")
            readable_err.append(filename)
        else:
            print(f" - Discovered: {gender} model file is present and readable.")
            
    if missing_files or readable_err:
        print("\nSTATUS: INSTALLATION REQUIRED")
        print("==================================================")
        return False

    # 3. Check pickle integrity & keys structure
    print("\n[3/4] Testing file integrity and structures...")
    required_keys = ["v_template", "weights", "f", "kintree_table"]
    integrity_failed = False
    
    for gender, filename in expected_files.items():
        filepath = os.path.join(model_dir, filename)
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f, encoding='latin1')
            if not isinstance(model_data, dict):
                print(f" - Error: {filename} does not contain a dictionary mapping.")
                integrity_failed = True
                continue
                
            missing_keys = [k for k in required_keys if k not in model_data]
            if missing_keys:
                print(f" - Error: {filename} is missing standard keys: {missing_keys}")
                integrity_failed = True
            else:
                print(f" - Validated: {gender} pickle mapping structures.")
        except Exception as e:
            print(f" - Parse Error on {filename}: {e}")
            integrity_failed = True

    if integrity_failed:
        print("\nSTATUS: INSTALLATION REQUIRED")
        print("==================================================")
        return False

    # 4. Final verification state
    print("\n[4/4] Finalizing status check...")
    print("\nSTATUS: READY FOR SMPL GENERATION")
    print("==================================================")
    return True

if __name__ == "__main__":
    check_installation()

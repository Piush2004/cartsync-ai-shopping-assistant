import os

def create_model_directories():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "models")
    
    subdirs = [
        "qwen",
        "mediapipe",
        "depth-anything-v2",
        "smpl",
        "idm-vton",
        "catvton",
        "cache",
        "weights"
    ]
    
    print("Creating AI models directory layout...")
    for subdir in subdirs:
        path = os.path.join(models_dir, subdir)
        os.makedirs(path, exist_ok=True)
        print(f" - Created: models/{subdir}/")
        
        # Write a placeholder descriptive README file inside the folder
        readme_path = os.path.join(path, "README.md")
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(f"# Models directory for: {subdir}\n\n")
            f.write(f"This folder holds checkpoints and runtime weights for the `{subdir}` component.\n")
            if subdir == "smpl":
                f.write("\n## Note for Licensed SMPL assets:\n")
                f.write("Please place the official licensed SMPL files (`basicModel_neutral_lbs_10_207_0_v1.0.0.pkl` etc.) here.\n")
            elif subdir == "depth-anything-v2":
                f.write("\n## Checkpoint location:\n")
                f.write("Please download `depth_anything_v2_vitl.pth` and place it in this directory.\n")
            elif subdir == "mediapipe":
                f.write("\n## Landmark Models:\n")
                f.write("Place `pose_landmarker_full.task` in this folder.\n")

    print("\nModel directory layout successfully initialized!")

if __name__ == "__main__":
    create_model_directories()

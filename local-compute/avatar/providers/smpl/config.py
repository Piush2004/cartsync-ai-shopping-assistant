import os

class SMPLConfig:
    # Model storage path references
    MODEL_DIR = os.getenv("SMPL_MODEL_DIR", "./models/smpl")
    
    # Model file names
    MODEL_NEUTRAL = os.path.join(MODEL_DIR, "basicModel_neutral_lbs_10_207_0_v1.0.0.pkl")
    MODEL_FEMALE = os.path.join(MODEL_DIR, "basicModel_f_lbs_10_207_0_v1.0.0.pkl")
    MODEL_MALE = os.path.join(MODEL_DIR, "basicModel_m_lbs_10_207_0_v1.0.0.pkl")
    
    # SMPL-X template placeholders
    SMPLX_MODEL_DIR = os.getenv("SMPLX_MODEL_DIR", "./models/smplx")
    
    # Output rendering paths
    OUTPUT_DIR = os.getenv("SMPL_OUTPUT_DIR", "./output/avatars")
    
    # Standard SMPL topology specs
    NUM_BETAS = 10
    NUM_JOINTS = 24
    NUM_VERTICES = 6890
    NUM_FACES = 13776

smpl_config = SMPLConfig()

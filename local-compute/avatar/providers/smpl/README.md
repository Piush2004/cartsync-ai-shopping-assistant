# SMPL Model Provider Setup

This folder implements the driver adapter connecting SMPL body modeling algorithms to the CartSyncAI Local Compute pipeline.

---

## 1. Setup Instructions & Path Configurations

Because of model licensing, official SMPL files cannot be distributed in this codebase. They must be retrieved from the Max Planck Institute.

1. Create a free account at [SMPL Project Site](https://smpl.is.tue.mpg.de/).
2. Download the version **SMPL Model v1.0.0 (Python / pickle compatible)**.
3. Extract and place the following `.pkl` files in the `local-compute/models/smpl/` directory:
   * **`basicModel_neutral_lbs_10_207_0_v1.0.0.pkl`** (Neutral model)
   * **`basicModel_f_lbs_10_207_0_v1.0.0.pkl`** (Female model)
   * **`basicModel_m_lbs_10_207_0_v1.0.0.pkl`** (Male model)

---

## 2. Directory Layout Reference

```
local-compute/
├── models/
│   └── smpl/
│       ├── basicModel_neutral_lbs_10_207_0_v1.0.0.pkl
│       ├── basicModel_f_lbs_10_207_0_v1.0.0.pkl
│       └── basicModel_m_lbs_10_207_0_v1.0.0.pkl
```

---

## 3. Configuration Overrides

You can customize directories by exporting environment variables:
```bash
export SMPL_MODEL_DIR="./models/smpl"
export SMPL_OUTPUT_DIR="./output/avatars"
```

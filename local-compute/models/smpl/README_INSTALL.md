# Official SMPL Model Assets Installation Guide

To configure the body-mesh calculation pipeline in production mode (deactivating the development cylinder fallbacks), you must download and install the official SMPL model files.

## 1. Register and Download
1. Navigate to the official SMPL project portal hosted by Max Planck Institute (MPI): [https://smpl.is.tue.mpg.de](https://smpl.is.tue.mpg.de)
2. Create a free user account and log in.
3. Access the **Downloads** section.
4. Download the following archives:
   - **SMPL for Python (version 1.0.0)** or newer.
   - Extract the archive to locate the `.pkl` binary files.

## 2. File Organization
Place the following pickle files inside this folder:
- **Neutral Model:** `basicModel_neutral_lbs_10_207_0_v1.0.0.pkl` (or symlink to `MODEL_NEUTRAL`)
- **Female Model:** `basicModel_f_lbs_10_207_0_v1.0.0.pkl`
- **Male Model:** `basicModel_m_lbs_10_207_0_v1.0.0.pkl`

Ensure filenames match those defined in `local-compute/avatar/providers/smpl/config.py`.

## 3. Validation Run
Run the verification diagnostic script:
```bash
python models/smpl/verify_real_smpl.py
```
This confirms that the assets have valid schemas, that the production flags are locked, and that emulation modes are completely deactivated.

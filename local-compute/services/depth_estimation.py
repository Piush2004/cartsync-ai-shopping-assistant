import math

class DepthEstimationService:
    def _get_distance(self, p1: dict, p2: dict) -> float:
        return math.sqrt((p1["x"] - p2["x"])**2 + (p1["y"] - p2["y"])**2)

    def estimate_depths(self, side_landmarks, pixels_per_cm: float) -> dict:
        """
        Estimates body thickness (depth) at the chest, waist, hips, and neck.
        Uses profile-view landmarks and pixel-to-cm calibration metrics.
        """
        # Landmark indices:
        # Ears: 7, 8
        # Shoulders: 11, 12
        # Hips: 23, 24
        p_l_ear_s = {"x": side_landmarks[7].x, "y": side_landmarks[7].y}
        p_r_ear_s = {"x": side_landmarks[8].x, "y": side_landmarks[8].y}
        p_l_sh_s = {"x": side_landmarks[11].x, "y": side_landmarks[11].y}
        p_r_sh_s = {"x": side_landmarks[12].x, "y": side_landmarks[12].y}
        p_l_hip_s = {"x": side_landmarks[23].x, "y": side_landmarks[23].y}
        p_r_hip_s = {"x": side_landmarks[24].x, "y": side_landmarks[24].y}
        
        # Estimate pixel depths using profile bounds
        neck_depth_px = self._get_distance(p_l_ear_s, p_r_ear_s) * 0.7
        chest_depth_px = self._get_distance(p_l_sh_s, p_r_sh_s) * 0.8
        waist_depth_px = self._get_distance(p_l_hip_s, p_l_sh_s) * 0.35
        hip_depth_px = self._get_distance(p_l_hip_s, p_r_hip_s) * 0.65
        thigh_depth_px = hip_depth_px * 0.75
        calf_depth_px = hip_depth_px * 0.45
        
        return {
            "neck_depth_cm": neck_depth_px / pixels_per_cm,
            "chest_depth_cm": chest_depth_px / pixels_per_cm,
            "waist_depth_cm": waist_depth_px / pixels_per_cm,
            "hip_depth_cm": hip_depth_px / pixels_per_cm,
            "thigh_depth_cm": thigh_depth_px / pixels_per_cm,
            "calf_depth_cm": calf_depth_px / pixels_per_cm
        }

depth_estimation_service = DepthEstimationService()

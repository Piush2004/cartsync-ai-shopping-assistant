import math
from .depth_estimation import depth_estimation_service

class MeasurementCalculatorService:
    def _get_distance(self, p1: dict, p2: dict) -> float:
        return math.sqrt((p1["x"] - p2["x"])**2 + (p1["y"] - p2["y"])**2)

    def _calculate_circumference(self, width_cm: float, depth_cm: float) -> float:
        """
        Approximates body circumference using Ramanujan's ellipse geometry formula.
        Circumference ≈ 2π * sqrt((a² + b²) / 2)
        """
        a = width_cm / 2
        b = depth_cm / 2
        return 2 * math.pi * math.sqrt((a**2 + b**2) / 2)

    def calculate_measurements(self, front_landmarks, side_landmarks, pixels_per_cm: float) -> dict:
        """
        Calculates:
        - Shoulder Width
        - Chest Circumference
        - Waist Circumference
        - Hip Circumference
        - Inseam
        - Sleeve Length
        - Neck Circumference
        """
        # Landmark indices:
        # Left/Right Ear: 7, 8
        # Left/Right Shoulder: 11, 12
        # Left/Right Elbow: 13, 14
        # Left/Right Wrist: 15, 16
        # Left/Right Hip: 23, 24
        # Left/Right Ankle: 27, 28

        # --- FRONT WIDTHS (PIXELS) ---
        p_l_ear = {"x": front_landmarks[7].x, "y": front_landmarks[7].y}
        p_r_ear = {"x": front_landmarks[8].x, "y": front_landmarks[8].y}
        p_l_sh = {"x": front_landmarks[11].x, "y": front_landmarks[11].y}
        p_r_sh = {"x": front_landmarks[12].x, "y": front_landmarks[12].y}
        p_l_el = {"x": front_landmarks[13].x, "y": front_landmarks[13].y}
        p_r_el = {"x": front_landmarks[14].x, "y": front_landmarks[14].y}
        p_l_wr = {"x": front_landmarks[15].x, "y": front_landmarks[15].y}
        p_r_wr = {"x": front_landmarks[16].x, "y": front_landmarks[16].y}
        p_l_hip = {"x": front_landmarks[23].x, "y": front_landmarks[23].y}
        p_r_hip = {"x": front_landmarks[24].x, "y": front_landmarks[24].y}
        p_l_ank = {"x": front_landmarks[27].x, "y": front_landmarks[27].y}
        p_r_ank = {"x": front_landmarks[28].x, "y": front_landmarks[28].y}

        # 1. Shoulder Width
        shoulder_width_px = self._get_distance(p_l_sh, p_r_sh)
        
        # 2. Chest Width
        chest_width_px = shoulder_width_px * 0.85
        
        # 3. Waist Width
        l_mid = {"x": (p_l_sh["x"] + p_l_hip["x"]) / 2, "y": (p_l_sh["y"] + p_l_hip["y"]) / 2}
        r_mid = {"x": (p_r_sh["x"] + p_r_hip["x"]) / 2, "y": (p_r_sh["y"] + p_r_hip["y"]) / 2}
        waist_width_px = self._get_distance(l_mid, r_mid)
        
        # 4. Hip Width
        hip_width_px = self._get_distance(p_l_hip, p_r_hip)
        
        # 5. Inseam
        hip_center = {"x": (p_l_hip["x"] + p_r_hip["x"]) / 2, "y": (p_l_hip["y"] + p_r_hip["y"]) / 2}
        ankle_center = {"x": (p_l_ank["x"] + p_r_ank["x"]) / 2, "y": (p_l_ank["y"] + p_r_ank["y"]) / 2}
        inseam_px = self._get_distance(hip_center, ankle_center)

        # 6. Sleeve Length (Shoulder to Elbow + Elbow to Wrist)
        left_sleeve_px = self._get_distance(p_l_sh, p_l_el) + self._get_distance(p_l_el, p_l_wr)
        right_sleeve_px = self._get_distance(p_r_sh, p_r_el) + self._get_distance(p_r_el, p_r_wr)
        sleeve_px = (left_sleeve_px + right_sleeve_px) / 2

        # 7. Neck Width
        neck_width_px = self._get_distance(p_l_ear, p_r_ear) * 0.75

        # --- PIXELS TO CM CONVERSION ---
        shoulder_width_cm = shoulder_width_px / pixels_per_cm
        chest_width_cm = chest_width_px / pixels_per_cm
        waist_width_cm = waist_width_px / pixels_per_cm
        hip_width_cm = hip_width_px / pixels_per_cm
        inseam_cm = inseam_px / pixels_per_cm
        sleeve_cm = sleeve_px / pixels_per_cm
        neck_width_cm = neck_width_px / pixels_per_cm

        # --- DELEGATE SIDE DEPTHS TO DEPTH ESTIMATION SERVICE ---
        depths = depth_estimation_service.estimate_depths(side_landmarks, pixels_per_cm)
        neck_depth_cm = depths["neck_depth_cm"]
        chest_depth_cm = depths["chest_depth_cm"]
        waist_depth_cm = depths["waist_depth_cm"]
        hip_depth_cm = depths["hip_depth_cm"]

        # --- CIRCUMFERENCES ---
        neck_circ_cm = self._calculate_circumference(neck_width_cm, neck_depth_cm)
        chest_circ_cm = self._calculate_circumference(chest_width_cm, chest_depth_cm)
        waist_circ_cm = self._calculate_circumference(waist_width_cm, waist_depth_cm)
        hip_circ_cm = self._calculate_circumference(hip_width_cm, hip_depth_cm)

        return {
            "shoulderWidth": int(round(shoulder_width_cm)),
            "chest": int(round(chest_circ_cm)),
            "waist": int(round(waist_circ_cm)),
            "hips": int(round(hip_circ_cm)),
            "inseam": int(round(inseam_cm)),
            "sleeve": int(round(sleeve_cm)),
            "neck": int(round(neck_circ_cm))
        }

measurement_calculator_service = MeasurementCalculatorService()

class SmplGeneratorService:
    def generate_shape_parameters(self, height_cm: float, chest_cm: float, waist_cm: float, hips_cm: float, inseam_cm: float) -> list:
        """
        Estimates the 10 principal component shape coefficients (betas) for the
        SMPL (Skinned Multi-Person Linear Model) body model based on anthropometric metrics.
        """
        # Tallness factor relative to average male/female height (172cm)
        height_diff = (height_cm - 172.0) / 10.0
        
        # Size differences relative to standard base fit lines
        chest_diff = (chest_cm - 92.0) / 10.0
        waist_diff = (waist_cm - 80.0) / 10.0
        hips_diff = (hips_cm - 96.0) / 10.0
        
        # Principal component approximations:
        # beta_0: Overall weight / volume
        beta_0 = (chest_diff + waist_diff + hips_diff) / 3.0
        # beta_1: Height / frame length
        beta_1 = height_diff
        # beta_2: Torso muscularity / fat distribution
        beta_2 = waist_diff - chest_diff
        # beta_3: Leg-to-torso proportions (inseam ratio)
        avg_leg = height_cm * 0.46
        beta_3 = (inseam_cm - avg_leg) / 5.0
        # beta_4: Gynoid (pear) vs Android (apple) body shape ratio
        beta_4 = hips_diff - waist_diff
        
        # Populate the 10 coefficients (with minor variations or zero fallbacks)
        betas = [
            round(beta_0, 4),
            round(beta_1, 4),
            round(beta_2, 4),
            round(beta_3, 4),
            round(beta_4, 4),
            round(beta_0 * 0.1, 4), # minor waist volume scale
            0.0, 0.0, 0.0, 0.0
        ]
        
        return betas

smpl_generator_service = SmplGeneratorService()

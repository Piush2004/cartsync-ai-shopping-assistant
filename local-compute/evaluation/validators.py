class EvaluationValidator:
    def validate_measurement_data(self, data: list) -> bool:
        """
        Validates that ground truth measurement records contain mandatory fields:
        height, chest, waist, hips.
        """
        if not isinstance(data, list):
            return False
        for record in data:
            if not isinstance(record, dict):
                return False
            for key in ["height", "chest", "waist", "hips"]:
                if key not in record:
                    return False
        return True

    def validate_vton_images(self, pair: dict) -> bool:
        """
        Verifies that VTON evaluation pairs specify valid file references.
        """
        return "person_image" in pair and "garment_image" in pair

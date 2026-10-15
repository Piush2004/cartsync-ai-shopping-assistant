class BrandNormalizer:
    def __init__(self, brand_mappings: dict = None):
        # Default naming normalization mapping
        self.mappings = {
            "chest": ["chest", "bust", "upper chest", "body chest", "chest width"],
            "waist": ["waist", "lower waist", "waist circumference", "midsection"],
            "hips": ["hips", "hip", "seat", "pelvis"],
            "height": ["height", "stature", "body height"],
            "shoulderWidth": ["shoulderwidth", "shoulder", "shoulders", "across shoulder"],
            "sleeve": ["sleeve", "sleeve length", "armsleeve"],
            "inseam": ["inseam", "inside leg", "crotch length"],
            "neck": ["neck", "collar", "neck size"],
            "thigh": ["thigh", "upper leg", "thigh width"],
            "calf": ["calf", "lower leg", "calf width"]
        }
        if brand_mappings:
            self.mappings.update(brand_mappings)

    def normalize_key(self, raw_key: str) -> str:
        """
        Maps brand-specific measurement name to unified internal representation.
        """
        if not raw_key:
            return ""
        norm_key = str(raw_key).strip().lower()
        for internal_key, synonyms in self.mappings.items():
            if norm_key in synonyms or norm_key == internal_key.lower():
                return internal_key
        return norm_key

    def normalize_chart_keys(self, size_chart: dict) -> dict:
        """
        Normalizes all keys in a size chart dictionary.
        """
        normalized_chart = {}
        for size_label, metrics in size_chart.items():
            normalized_chart[size_label] = {
                self.normalize_key(k): v for k, v in metrics.items()
            }
        return normalized_chart

brand_normalizer = BrandNormalizer()

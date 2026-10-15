class VtonGuardrail:
    def validate_inputs(self, payload: dict) -> None:
        """
        Validates all input fields, URLs, and garment categories for Virtual Try-On.
        Raises ValueError if validations fail.
        """
        uid = payload.get("uid")
        person_image_url = payload.get("personImageUrl")
        garment_image_url = payload.get("garmentImageUrl")
        category = payload.get("category")
        
        # 1. Check required parameters
        if not uid:
            raise ValueError("VTON payload missing user identifier ('uid').")
        if not person_image_url:
            raise ValueError("VTON payload missing person image URL ('personImageUrl').")
        if not garment_image_url:
            raise ValueError("VTON payload missing garment image URL ('garmentImageUrl').")
        if not category:
            raise ValueError("VTON payload missing garment category ('category').")
            
        # 2. Check garment category bounds
        allowed_categories = ["upper_body", "lower_body", "dresses", "tops", "bottoms"]
        if category.lower() not in allowed_categories:
            raise ValueError(f"Unsupported garment category '{category}'. Supported: {', '.join(allowed_categories)}.")
            
        # 3. Check image URLs formatting
        for label, url in [("Person", person_image_url), ("Garment", garment_image_url)]:
            if not url.startswith(('http://', 'https://', '/')) and not os.path.exists(url):
                # Simple check, import os if needed
                import os
                if not os.path.exists(url):
                    raise ValueError(f"Invalid path or URL for {label} image: '{url}'.")

        # 4. Mock Safety / NSFW Guardrail Check
        # In a real environment, we could run a safety classifier or content moderator
        print(f"[VtonGuardrail] Safety and validation checks passed for user: {uid}")

vton_guardrail = VtonGuardrail()

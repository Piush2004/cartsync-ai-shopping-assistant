import re
import datetime
from firebase_admin import firestore

class StyleProfileEngine:
    def extract_and_update(self, db, uid: str, user_prompt: str) -> dict:
        """
        Parses user prompts to extract style attributes and updates styleProfiles collection.
        Extracts: favorite brands, favorite colors, preferred fit, budget, shopping habits, and occasions.
        """
        prompt = user_prompt.lower()
        
        # 1. Favorite Brands
        brands = ["nike", "zara", "h&m", "hm", "levis", "levi's", "adidas", "gucci", "prada", "uniqlo"]
        fav_brands = []
        for brand in brands:
            if re.search(rf"\b(like|love|prefer|wear|buy)\b.*?\b{brand}\b", prompt) or re.search(rf"\b{brand}\b.*?\b(is my favorite|are my favorite)\b", prompt):
                fav_brands.append(brand.replace("hm", "h&m").capitalize())

        # 2. Favorite Colors
        colors = ["red", "blue", "green", "yellow", "black", "white", "pink", "purple", "orange", "brown", "navy", "gray"]
        fav_colors = []
        for color in colors:
            if re.search(rf"\b(like|love|prefer|wear|favorite color|favorite colors)\b.*?\b{color}\b", prompt):
                fav_colors.append(color.capitalize())

        # 3. Preferred Fit
        fits = ["tight", "regular", "relaxed", "oversized", "slim", "baggy", "loose"]
        preferred_fit = None
        for fit in fits:
            if re.search(rf"\b(prefer|like|want|wear|fit is|fit:)\b.*?\b{fit}\b", prompt):
                if fit in ["slim", "tight"]:
                    preferred_fit = "Tight"
                elif fit in ["baggy", "loose", "relaxed"]:
                    preferred_fit = "Relaxed"
                elif fit == "oversized":
                    preferred_fit = "Oversized"
                else:
                    preferred_fit = "Regular"

        # 4. Budget
        budget = None
        dollar_match = re.search(r"\b(under|above|around|budget of)?\s*\$?(\d+)\b", prompt)
        if dollar_match:
            prefix = dollar_match.group(1) or "Around"
            amount = dollar_match.group(2)
            budget = f"{prefix.capitalize()} ${amount}"
        elif "cheap" in prompt or "affordable" in prompt:
            budget = "Under $50"
        elif "expensive" in prompt or "luxury" in prompt or "high-end" in prompt:
            budget = "Luxury / $200+"

        # 5. Shopping Habits
        shopping_habits = []
        if any(w in prompt for w in ["sale", "discount", "cheap", "deal", "clearance"]):
            shopping_habits.append("Value-driven")
        if any(w in prompt for w in ["luxury", "designer", "quality", "premium", "brand-name"]):
            shopping_habits.append("Quality-oriented")
        if any(w in prompt for w in ["sustainable", "eco-friendly", "organic", "green"]):
            shopping_habits.append("Eco-conscious")
        if any(w in prompt for w in ["frequent", "monthly", "always buy", "trend"]):
            shopping_habits.append("Trend-follower")

        # 6. Favorite Occasions
        occasions = ["casual", "formal", "sporty", "work", "party", "wedding", "streetwear", "business", "date"]
        fav_occasions = []
        for occasion in occasions:
            if re.search(rf"\b(wear to|for|appropriate for|occasion is|suit for)\b.*?\b{occasion}\b", prompt) or occasion in prompt:
                fav_occasions.append(occasion.capitalize())

        # Check if anything was extracted
        if fav_brands or fav_colors or preferred_fit or budget or shopping_habits or fav_occasions:
            profile_ref = db.collection('styleProfiles').document(uid)
            try:
                profile_snap = profile_ref.get()
                current_profile = profile_snap.to_dict() if profile_snap.exists else {}
                
                # Merge list profiles
                merged_brands = list(set(current_profile.get("favoriteBrands", []) + fav_brands))
                merged_colors = list(set(current_profile.get("favoriteColors", []) + fav_colors))
                merged_occasions = list(set(current_profile.get("occasions", []) + fav_occasions))
                merged_habits = list(set(current_profile.get("shoppingHabits", []) + shopping_habits))
                
                final_fit = preferred_fit or current_profile.get("preferredFit", "Regular")
                final_budget = budget or current_profile.get("budgetRange", "Not specified")
                
                # Compute confidence score
                fields_filled = sum([
                    1 if merged_brands else 0,
                    1 if merged_colors else 0,
                    1 if final_fit != "Regular" else 0.5,
                    1 if final_budget != "Not specified" else 0,
                    1 if merged_habits else 0,
                    1 if merged_occasions else 0
                ])
                confidence_score = round(min(0.99, 0.5 + (fields_filled * 0.08)), 2)
                
                now = datetime.datetime.now(datetime.timezone.utc).isoformat()
                
                update_data = {
                    "uid": uid,
                    "favoriteBrands": merged_brands,
                    "favoriteColors": merged_colors,
                    "preferredFit": final_fit,
                    "budgetRange": final_budget,
                    "shoppingHabits": merged_habits,
                    "occasions": merged_occasions,
                    "confidenceScore": confidence_score,
                    "updatedAt": now,
                    "modelName": "Qwen-2 4B / StyleProfileRegexEngine",
                    "modelVersion": "2.0.0",
                    "workerVersion": "1.0.0",
                    "generatedAt": now
                }
                
                profile_ref.set(update_data, merge=True)
                print(f"[StyleProfileEngine] Successfully updated profile for user: {uid}")

                # Log event in activityTimeline
                try:
                    db.collection('activityTimeline').add({
                        "uid": uid,
                        "eventType": "Style Profile Updated",
                        "timestamp": now,
                        "details": {"confidenceScore": confidence_score}
                    })
                except Exception as act_err:
                    print(f"[StyleProfileEngine] Failed to write event to activityTimeline: {act_err}")

                return update_data
            except Exception as e:
                print(f"[StyleProfileEngine] Failed to update style profile: {e}")
                
        return {}

style_profile_engine = StyleProfileEngine()

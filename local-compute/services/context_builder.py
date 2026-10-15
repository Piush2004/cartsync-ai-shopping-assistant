import datetime
from firebase_admin import firestore

class ContextBuilderService:
    def build_context(self, db, uid: str, session_id: str) -> str:
        """
        Assembles a centralized final prompt context for the LLM Worker.
        Loads latest chat summary, style profile, body measurements, and the last 3 messages.
        """
        context = "=== USER CONTEXT ===\n"

        # 1. Fetch Measurement Profile
        try:
            meas_doc = db.collection('measurementProfiles').document(uid).get()
            if meas_doc.exists:
                m = meas_doc.to_dict()
                context += f"Physical measurements: Height {m.get('heightCm')}cm, Shoulder Width {m.get('shoulderWidthCm')}cm, Chest {m.get('chestCm')}cm, Waist {m.get('waistCm')}cm, Hips {m.get('hipsCm')}cm, Inseam {m.get('inseamCm')}cm, Sleeve {m.get('sleeveCm')}cm, Neck {m.get('neckCm')}cm.\n"
        except Exception as e:
            print(f"[ContextBuilder] Error loading measurements: {e}")

        # 2. Fetch Style Profile
        try:
            profile_doc = db.collection('styleProfiles').document(uid).get()
            if profile_doc.exists:
                p = profile_doc.to_dict()
                context += f"Style Preferences:\n"
                if p.get("favoriteBrands"):
                    context += f" - Favorite Brands: {', '.join(p['favoriteBrands'])}\n"
                if p.get("favoriteColors"):
                    context += f" - Favorite Colors: {', '.join(p['favoriteColors'])}\n"
                if p.get("preferredFit"):
                    context += f" - Preferred Fit: {p['preferredFit']}\n"
                if p.get("budgetRange"):
                    context += f" - Budget Limit: {p['budgetRange']}\n"
                if p.get("shoppingHabits"):
                    context += f" - Shopping Habits: {', '.join(p['shoppingHabits'])}\n"
                if p.get("occasions"):
                    context += f" - Styled Occasions: {', '.join(p['occasions'])}\n"
        except Exception as e:
            print(f"[ContextBuilder] Error loading style profile: {e}")

        # 3. Fetch Latest Chat Summary from chatSummaries collection
        try:
            summary_snap = db.collection('chatSummaries') \
                .where('uid', '==', uid) \
                .order_by('updatedAt', direction=firestore.Query.DESCENDING) \
                .limit(1) \
                .get()
            
            if len(summary_snap) > 0:
                summary_data = summary_snap[0].to_dict()
                context += f"Latest Conversation Summary: {summary_data.get('summaryText') or summary_data.get('summary') or 'None'}\n"
        except Exception as e:
            print(f"[ContextBuilder] Error loading chat summary: {e}")

        context += "\n=== CONVERSATION HISTORY (LAST 3 MESSAGES) ===\n"

        # 4. Fetch Last 3 Chat Messages from chatSessions/{sessionId}/messages
        try:
            messages_snap = db.collection('chatSessions').document(session_id).collection('messages') \
                .order_by('timestamp', direction=firestore.Query.DESCENDING) \
                .limit(3) \
                .get()
            
            msgs = []
            for doc in messages_snap:
                msgs.append(doc.to_dict())
            msgs.reverse()

            for msg in msgs:
                sender = msg.get("role", "user").upper()
                text = msg.get("content", "")
                context += f"{sender}: {text}\n"
        except Exception as e:
            print(f"[ContextBuilder] Error loading chat history: {e}")

        context += "\nInstructions: Use the styling context, physical details, and conversation history above to formulate a personalized, accurate response."
        return context

context_builder_service = ContextBuilderService()

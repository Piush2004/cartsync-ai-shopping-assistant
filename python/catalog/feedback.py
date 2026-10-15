from firebase_admin import firestore
from catalog.schema import RecommendationFeedback
import uuid
import datetime

class FeedbackEngine:
    def __init__(self):
        self.db = firestore.client()
        self.collection = self.db.collection("feedback")

    def log_feedback(self, 
                     user_id: str, 
                     product_id: str, 
                     recommended_size: str, 
                     user_purchased: bool, 
                     user_returned: bool, 
                     fit_feedback: str) -> str:
        
        feedback_id = str(uuid.uuid4())
        feedback = RecommendationFeedback(
            feedback_id=feedback_id,
            user_id=user_id,
            product_id=product_id,
            recommended_size=recommended_size,
            user_purchased=user_purchased,
            user_returned=user_returned,
            fit_feedback=fit_feedback,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
        self.collection.document(feedback_id).set(feedback.dict())
        return feedback_id

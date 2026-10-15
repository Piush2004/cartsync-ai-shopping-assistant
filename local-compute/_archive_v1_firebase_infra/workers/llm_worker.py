import datetime
import requests
import json
import os
import re
from workers.base_worker import BaseWorker
from firebase_admin import firestore
from config.settings import settings

class LLMWorker(BaseWorker):
    def __init__(self):
        super().__init__("LLMWorker", ["LLM"])

    def _save_chat_message(self, db, session_id: str, uid: str, user_prompt: str, assistant_response: str, model_name: str):
        """Appends user and assistant messages back to the Firestore session, including model metadata."""
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        expires_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)).isoformat()
        
        user_msg = {"role": "user", "content": user_prompt, "timestamp": now}
        
        model_metadata = {
            "modelName": model_name,
            "modelVersion": "2.0.0",
            "workerVersion": "1.0.0",
            "generatedAt": now
        }
        
        assistant_msg = {
            "role": "assistant", 
            "content": assistant_response, 
            "timestamp": now,
            "metadata": model_metadata
        }
        
        doc_ref = db.collection('chatSessions').document(session_id)
        
        try:
            doc = doc_ref.get()
            if doc.exists:
                doc_ref.update({
                    "messages": firestore.ArrayUnion([user_msg, assistant_msg]),
                    "updatedAt": now
                })
            else:
                doc_ref.set({
                    "sessionId": session_id,
                    "uid": uid,
                    "title": user_prompt[:40] + "...",
                    "messages": [user_msg, assistant_msg],
                    "createdAt": now,
                    "updatedAt": now,
                    "expiresAt": expires_at
                })
        except Exception as e:
            print(f"[LLMWorker] Error saving chat messages: {e}")

    def _update_style_profile(self, db, uid: str, user_prompt: str):
        """
        Delegates prompt styling extraction to Phase 16 StyleProfileEngine.
        """
        from services.style_profile import style_profile_engine
        style_profile_engine.extract_and_update(db, uid, user_prompt)

    def execute(self, payload: dict) -> dict:
        """
        Executes prompt, utilizes ContextBuilderService context,
        extracts style profiles, and queries Ollama to generate recommendations.
        """
        uid = payload.get("uid")
        session_id = payload.get("sessionId")
        prompt = payload.get("prompt")
        
        if not uid or not session_id or not prompt:
            raise ValueError("LLM payload requires 'uid', 'sessionId', and 'prompt' keys.")

        # Determine Ollama configuration
        ollama_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model_name = payload.get("modelName") or os.getenv("MODEL_NAME", "qwen2:8b")

        print(f"[LLMWorker] Executing LLM prompt on session: {session_id} using model: {model_name}")

        db = firestore.client()

        # 1. Fetch prompt context via ContextBuilderService
        from services.context_builder import context_builder_service
        prompt_context = context_builder_service.build_context(db, uid, session_id)
        
        # 2. Build system instruction
        system_instruction = (
            "You are the CartSyncAI Fashion Stylist, an expert personal fashion assistant. "
            "Help the user find clothes that fit their body measurements and suit their style. "
            "Be friendly, concise, and focused on style matches.\n\n"
            f"Here is the context of the user and history:\n{prompt_context}"
        )

        # 3. Construct messages payload
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]

        # 4. Execute request to Ollama
        response_text = ""
        try:
            response = requests.post(f"{ollama_base}/api/chat", json={
                "model": model_name,
                "messages": messages,
                "stream": False
            }, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                response_text = data.get("message", {}).get("content", "")
            else:
                raise RuntimeError(f"Ollama error (status {response.status_code}): {response.text}")
        except Exception as e:
            # Fallback mock stylist response in case local Ollama is offline/loading
            print(f"[LLMWorker] Warning: Local Ollama request failed: {e}. Generating fallback styling advice.")
            response_text = (
                f"Thank you for your question! (Stylist Offline Mode)\n\n"
                f"Based on your profile, I recommend choosing garments that complement your body silhouette. "
                f"For brands like Zara or Nike, M/L sizes should align with your chest width. "
                f"Try looking at streetwear/casual selections!"
            )

        # 5. Save chat messages to Firestore
        self._save_chat_message(db, session_id, uid, prompt, response_text, model_name)

        # 6. Extract style preferences
        self._update_style_profile(db, uid, prompt)

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return {
            "response": response_text,
            "metadata": {
                "modelName": model_name,
                "modelVersion": "2.0.0",
                "workerVersion": "1.0.0",
                "generatedAt": now
            }
        }

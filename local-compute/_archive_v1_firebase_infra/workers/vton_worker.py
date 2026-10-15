import uuid
import datetime
from workers.base_worker import BaseWorker
from services.guardrail import vton_guardrail
from services.idm_vton import idm_vton_service
from services.render_manager import render_manager_service
from firebase_admin import firestore

class VtonWorker(BaseWorker):
    def __init__(self):
        super().__init__("VtonWorker", ["VTON"])

    def _refund_credits(self, db, uid: str, cost: int, job_id: str):
        """
        Atomically refunds credits to the user using a transaction
        and records a REFUND_ERROR transaction.
        """
        user_ref = db.collection('users').document(uid)
        tx_id = f"tx-{uuid.uuid4().hex[:12]}"
        tx_ref = db.collection('transactions').document(tx_id)
        
        @firestore.transactional
        def _refund_transaction(transaction):
            user_snap = user_ref.get(transaction=transaction)
            current_credits = 0
            if user_snap.exists:
                current_credits = user_snap.to_dict().get("credits", 0)
                
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            # Increment credits
            transaction.update(user_ref, {
                "credits": current_credits + cost,
                "updatedAt": now
            })
            
            # Write transaction log
            transaction.set(tx_ref, {
                "txId": tx_id,
                "uid": uid,
                "action": "REFUND_ERROR",
                "amount": cost,
                "jobId": job_id,
                "timestamp": now
            })
            
        try:
            transaction = db.transaction()
            _refund_transaction(transaction)
            print(f"[VtonWorker] Refunded {cost} credits to user: {uid}")
        except Exception as e:
            print(f"[VtonWorker] Failed to refund credits for user {uid}: {e}")

    def execute(self, payload: dict) -> dict:
        """
        Coordinates the virtual try-on workflow:
        1. Validate inputs via Guardrails
        2. Perform IDM-VTON diffusion inference
        3. Upload output to Firebase Storage
        4. Return result signed URL
        5. In case of failure, refund credits
        """
        uid = payload.get("uid")
        job_id = payload.get("jobId") or f"job-{uuid.uuid4().hex[:8]}"
        credit_cost = 2 # VTON costs 2 credits
        
        # --- STEP 1: VALIDATE INPUTS (GUARDRAILS) ---
        print("[VtonWorker] Stage 1/4: Running safety and input validation guardrails...")
        try:
            vton_guardrail.validate_inputs(payload)
            
            # Execute pose/quality validations if the target input is a real photo (not a 3D model)
            person_img_url = payload.get("personImageUrl", "")
            if not person_img_url.endswith(('.obj', '.fbx')) and 'mock' not in person_img_url:
                from agents.validation_agent import validation_agent
                validation_res = validation_agent.validate_inputs(payload)
                if not validation_res["valid"]:
                    raise ValueError(f"Photo failed validation: {', '.join(validation_res['issues'])}")
        except Exception as e:
            print(f"[VtonWorker] Validation failed: {e}")
            db = firestore.client()
            self._refund_credits(db, uid, credit_cost, job_id)
            raise ValueError(f"Input validation failed: {e}")

        # --- STEP 2: IDM-VTON INFERENCE ---
        print("[VtonWorker] Stage 2/4: Commencing IDM-VTON model inference pipeline...")
        try:
            result_image = idm_vton_service.run_inference(
                payload.get("personImageUrl"),
                payload.get("garmentImageUrl"),
                payload.get("category")
            )
        except Exception as e:
            print(f"[VtonWorker] Model inference failed: {e}")
            db = firestore.client()
            self._refund_credits(db, uid, credit_cost, job_id)
            raise RuntimeError(f"IDM-VTON inference failed: {e}")

        # --- VALIDATE GENERATED IMAGE ---
        print("[VtonWorker] Validating generated try-on output image...")
        try:
            from PIL import Image
            import numpy as np
            if not result_image or not isinstance(result_image, Image.Image):
                raise ValueError("Inference returned an invalid image object.")
            w, h = result_image.size
            if w < 100 or h < 100:
                raise ValueError(f"Generated image dimensions are too small: {w}x{h}.")
            img_gray = result_image.convert('L')
            gray_np = np.array(img_gray)
            mean_val = float(np.mean(gray_np))
            std_val = float(np.std(gray_np))
            if mean_val < 5.0 or mean_val > 250.0 or std_val < 2.0:
                raise ValueError(f"Generated image has corrupted flat/blank pixels (mean={mean_val:.1f}, std={std_val:.1f}).")
        except Exception as eval_err:
            print(f"[VtonWorker] Output image validation rejected: {eval_err}")
            db = firestore.client()
            self._refund_credits(db, uid, credit_cost, job_id)
            raise ValueError(f"Generated try-on output is corrupted: {eval_err}")

        # --- STEP 3: RENDER STORAGE & COMPLETION ---
        print("[VtonWorker] Stage 3/4: Uploading composite try-on image to storage...")
        try:
            output_url = render_manager_service.save_and_upload_result(uid, result_image)
        except Exception as e:
            print(f"[VtonWorker] Storage upload failed: {e}")
            db = firestore.client()
            self._refund_credits(db, uid, credit_cost, job_id)
            raise RuntimeError(f"Storage upload failed: {e}")

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        # Log event in activityTimeline
        try:
            db = firestore.client()
            db.collection('activityTimeline').add({
                "uid": uid,
                "eventType": "VTON Completed",
                "timestamp": now,
                "details": {"outputUrl": output_url, "jobId": job_id}
            })
        except Exception as act_err:
            print(f"[VtonWorker] Failed to write event to activityTimeline: {act_err}")

        print(f"[VtonWorker] Stage 4/4: Try-on complete. Output URL generated: {output_url}")
        return {
            "outputUrl": output_url,
            "modelName": "IDM-VTON Diffusion",
            "modelVersion": "1.0.0",
            "workerVersion": "1.0.0",
            "generatedAt": now
        }

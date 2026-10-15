import os
import uuid
import datetime
import firebase_admin
from firebase_admin import storage
from PIL import Image
from io import BytesIO

class RenderManagerService:
    def save_and_upload_result(self, uid: str, image: Image.Image) -> str:
        """
        Converts the try-on PIL image to a byte buffer, uploads it to the user's
        Firebase Storage bucket, and returns a signed read URL.
        """
        try:
            bucket = storage.bucket()
            file_name = f"users/{uid}/vton_assets/{uuid.uuid4().hex}.jpg"
            blob = bucket.blob(file_name)
            
            # Save PIL image into a JPEG memory buffer
            buffer = BytesIO()
            image.save(buffer, format="JPEG", quality=90)
            buffer.seek(0)
            
            # Upload image file to Firebase Storage
            blob.upload_from_file(buffer, content_type="image/jpeg")
            
            # Generate a signed read URL valid for 2 hours
            try:
                expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=2)
                signed_url = blob.generate_signed_url(expiration=expiration)
                print(f"[RenderManager] VTON result uploaded to Storage: {file_name}")
                return signed_url
            except Exception as e:
                print(f"[RenderManager] Warning: generate_signed_url failed: {e}. Returning public URL format.")
                return f"https://storage.googleapis.com/{bucket.name}/{file_name}"
                
        except Exception as e:
            print(f"[RenderManager] Warning: Firebase Storage upload failed: {e}. Returning mock asset URL.")
            # Offline/local development fallback URL
            return f"mock_vton_result_for_{uid}_{uuid.uuid4().hex[:6]}.jpg"

render_manager_service = RenderManagerService()

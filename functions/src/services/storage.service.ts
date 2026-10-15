import { storage } from '../config/firebase';
import { randomUUID } from 'crypto';

export class StorageService {
  /**
   * Generates a signed URL for a client to directly upload an image to Firebase Storage.
   */
  async getUploadUrl(uid: string, path: 'raw_uploads' | 'vton_assets', contentType: string = 'image/jpeg'): Promise<{ url: string; filePath: string }> {
    const bucket = storage.bucket();
    const fileName = `${randomUUID()}.jpg`;
    const filePath = `users/${uid}/${path}/${fileName}`;
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType
    });

    return { url, filePath };
  }

  /**
   * Generates a signed read URL for a given storage path.
   */
  async getDownloadUrl(filePath: string): Promise<string> {
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    });
    
    return url;
  }
}

export const storageService = new StorageService();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.StorageService = void 0;
const firebase_1 = require("../config/firebase");
const crypto_1 = require("crypto");
class StorageService {
    /**
     * Generates a signed URL for a client to directly upload an image to Firebase Storage.
     */
    async getUploadUrl(uid, path, contentType = 'image/jpeg') {
        const bucket = firebase_1.storage.bucket();
        const fileName = `${(0, crypto_1.randomUUID)()}.jpg`;
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
    async getDownloadUrl(filePath) {
        const bucket = firebase_1.storage.bucket();
        const file = bucket.file(filePath);
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
        });
        return url;
    }
}
exports.StorageService = StorageService;
exports.storageService = new StorageService();
//# sourceMappingURL=storage.service.js.map
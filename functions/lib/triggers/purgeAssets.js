"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeAssets = void 0;
const functions = __importStar(require("firebase-functions"));
const firebaseAdmin_1 = require("../utils/firebaseAdmin");
exports.purgeAssets = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = firebaseAdmin_1.admin.firestore.Timestamp.now();
    let purgedCount = 0;
    try {
        // We need a collection group query or to iterate through users.
        // For scale, usually collectionGroup is better, but requires an index.
        // Assuming 'vtonAssets' collectionGroup index is created.
        const expiredAssetsSnapshot = await firebaseAdmin_1.db.collectionGroup('vtonAssets')
            .where('expiresAt', '<=', now)
            .get();
        if (expiredAssetsSnapshot.empty) {
            functions.logger.info('No expired assets found to purge.');
            return null;
        }
        const batch = firebaseAdmin_1.db.batch();
        // Limit batches to 500 (Firestore limit)
        let batchCount = 0;
        for (const doc of expiredAssetsSnapshot.docs) {
            // const data = doc.data();
            // Note: In a real app, you would also delete the actual files from Firebase Storage here
            // using admin.storage().bucket().file(data.inputImagePath).delete()
            // This is simplified for the demo.
            batch.delete(doc.ref);
            purgedCount++;
            batchCount++;
            if (batchCount === 500) {
                await batch.commit();
                batchCount = 0;
            }
        }
        if (batchCount > 0) {
            await batch.commit();
        }
        functions.logger.info(`Successfully purged ${purgedCount} expired VTON assets.`);
        return null;
    }
    catch (error) {
        functions.logger.error('Error during asset purge:', error);
        return null;
    }
});
//# sourceMappingURL=purgeAssets.js.map
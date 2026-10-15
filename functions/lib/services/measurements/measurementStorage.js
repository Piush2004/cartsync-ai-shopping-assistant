"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMeasurementProfile = saveMeasurementProfile;
const firestore_1 = require("firebase-admin/firestore");
const activity_service_1 = require("../activity.service");
/**
 * Handles database operations for measurement profiles.
 * Images are explicitly excluded to comply with 24h retention privacy requirements.
 */
async function saveMeasurementProfile(uid, profile) {
    const db = (0, firestore_1.getFirestore)();
    const measurementRef = db.collection('measurementProfiles').doc(uid);
    await measurementRef.set({
        uid,
        height: profile.height,
        shoulderWidth: profile.shoulderWidth,
        chest: profile.chest,
        waist: profile.waist,
        hips: profile.hips,
        inseam: profile.inseam,
        confidence: profile.confidence,
        createdAt: new Date().toISOString()
    }, { merge: true });
    // Log user activity
    await activity_service_1.activityService.logEvent(uid, 'Measurement Completed', { confidence: profile.confidence });
}
//# sourceMappingURL=measurementStorage.js.map
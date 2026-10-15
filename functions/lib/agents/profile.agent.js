"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileAgent = exports.ProfileAgent = void 0;
const firebase_1 = require("../config/firebase");
class ProfileAgent {
    /**
     * Retrieves the user's styling preferences (e.g. favorite brands, disliked colors).
     */
    async getStylingPreferences(uid) {
        try {
            const doc = await firebase_1.db.collection('userPreferences').doc(uid).get();
            return doc.exists ? doc.data() : null;
        }
        catch (e) {
            console.error(`[ProfileAgent] Error fetching preferences for user ${uid}:`, e);
            return null;
        }
    }
    /**
     * Retrieves the user's calculated physical body measurements.
     */
    async getMeasurementProfile(uid) {
        try {
            const doc = await firebase_1.db.collection('measurementProfiles').doc(uid).get();
            return doc.exists ? doc.data() : null;
        }
        catch (e) {
            console.error(`[ProfileAgent] Error fetching measurement profile for user ${uid}:`, e);
            return null;
        }
    }
    /**
     * Checks the user's available credits.
     */
    async getUserCredits(uid) {
        try {
            const doc = await firebase_1.db.collection('users').doc(uid).get();
            return doc.exists ? (doc.data()?.credits || 0) : 0;
        }
        catch (e) {
            console.error(`[ProfileAgent] Error checking credits for user ${uid}:`, e);
            return 0;
        }
    }
}
exports.ProfileAgent = ProfileAgent;
exports.profileAgent = new ProfileAgent();
//# sourceMappingURL=profile.agent.js.map
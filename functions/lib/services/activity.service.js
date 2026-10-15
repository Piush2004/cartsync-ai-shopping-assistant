"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityService = exports.ActivityService = void 0;
const firebase_1 = require("../config/firebase");
class ActivityService {
    /**
     * Logs a user activity event directly into the activityTimeline collection.
     */
    async logEvent(uid, eventType, details) {
        console.log(`[ActivityService] Logging event "${eventType}" for user: ${uid}`);
        try {
            const timestamp = new Date().toISOString();
            await firebase_1.db.collection('activityTimeline').add({
                uid,
                eventType,
                timestamp,
                details: details || {}
            });
        }
        catch (error) {
            console.error(`[ActivityService] Failed to log activity event:`, error);
        }
    }
}
exports.ActivityService = ActivityService;
exports.activityService = new ActivityService();
//# sourceMappingURL=activity.service.js.map
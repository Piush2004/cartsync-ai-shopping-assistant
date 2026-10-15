import { db } from '../config/firebase';

export interface ActivityEvent {
  uid: string;
  eventType: 'Signup' | 'Measurement Completed' | 'Avatar Generated' | 'VTON Completed' | 'Style Profile Updated' | 'Product Saved';
  timestamp: string;
  details?: Record<string, any>;
}

export class ActivityService {
  /**
   * Logs a user activity event directly into the activityTimeline collection.
   */
  async logEvent(uid: string, eventType: ActivityEvent['eventType'], details?: Record<string, any>): Promise<void> {
    console.log(`[ActivityService] Logging event "${eventType}" for user: ${uid}`);
    try {
      const timestamp = new Date().toISOString();
      await db.collection('activityTimeline').add({
        uid,
        eventType,
        timestamp,
        details: details || {}
      });
    } catch (error) {
      console.error(`[ActivityService] Failed to log activity event:`, error);
    }
  }
}

export const activityService = new ActivityService();

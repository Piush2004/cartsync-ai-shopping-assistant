import { db } from '../config/firebase';

export class ProfileAgent {
  /**
   * Retrieves the user's styling preferences (e.g. favorite brands, disliked colors).
   */
  async getStylingPreferences(uid: string): Promise<any> {
    try {
      const doc = await db.collection('userPreferences').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.error(`[ProfileAgent] Error fetching preferences for user ${uid}:`, e);
      return null;
    }
  }

  /**
   * Retrieves the user's calculated physical body measurements.
   */
  async getMeasurementProfile(uid: string): Promise<any> {
    try {
      const doc = await db.collection('measurementProfiles').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.error(`[ProfileAgent] Error fetching measurement profile for user ${uid}:`, e);
      return null;
    }
  }

  /**
   * Checks the user's available credits.
   */
  async getUserCredits(uid: string): Promise<number> {
    try {
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists ? (doc.data()?.credits || 0) : 0;
    } catch (e) {
      console.error(`[ProfileAgent] Error checking credits for user ${uid}:`, e);
      return 0;
    }
  }
}

export const profileAgent = new ProfileAgent();

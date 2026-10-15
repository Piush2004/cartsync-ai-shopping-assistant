import { getFirestore } from 'firebase-admin/firestore';
import { MeasurementProfile } from './measurementEngine';
import { activityService } from '../activity.service';

/**
 * Handles database operations for measurement profiles.
 * Images are explicitly excluded to comply with 24h retention privacy requirements.
 */
export async function saveMeasurementProfile(uid: string, profile: MeasurementProfile): Promise<void> {
  const db = getFirestore();
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
  await activityService.logEvent(uid, 'Measurement Completed', { confidence: profile.confidence });
}

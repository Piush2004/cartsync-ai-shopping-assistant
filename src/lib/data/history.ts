import { MeasurementProfile } from '../intelligence/measurement';
import { MeasurementHistoryRecord } from './types';
import { analytics } from './analytics';

export interface HistoryRepository {
  saveProfile(profile: MeasurementProfile): Promise<MeasurementHistoryRecord>;
  getActiveProfile(userId: string): Promise<MeasurementHistoryRecord | null>;
  getProfileHistory(userId: string): Promise<MeasurementHistoryRecord[]>;
}

/**
 * Manages the versioning and lifecycle of Measurement Profiles.
 * When a user retakes a scan or is calibrated by the Learning Engine,
 * their previous profile is archived, not overwritten.
 */
export class InMemoryHistoryRepository implements HistoryRepository {
  private historyStore: MeasurementHistoryRecord[] = [];

  async saveProfile(profile: MeasurementProfile): Promise<MeasurementHistoryRecord> {
    // 1. Deactivate current active profile
    const existing = this.historyStore.filter(h => h.userId === profile.userId && h.active);
    existing.forEach(h => h.active = false);

    // 2. Create new record
    const record: MeasurementHistoryRecord = {
      id: `mhr_${Math.random().toString(36).substring(2, 9)}`,
      userId: profile.userId,
      timestamp: new Date().toISOString(),
      profile: { ...profile }, // Clone
      active: true
    };

    this.historyStore.push(record);

    // 3. Fire telemetry
    analytics.track('PROFILE_SAVED', {
      version: profile.version,
      source: profile.source,
      algorithmVersion: profile.metadata.algorithmVersion
    }, profile.userId);

    return record;
  }

  async getActiveProfile(userId: string): Promise<MeasurementHistoryRecord | null> {
    return this.historyStore.find(h => h.userId === userId && h.active) || null;
  }

  async getProfileHistory(userId: string): Promise<MeasurementHistoryRecord[]> {
    return this.historyStore
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

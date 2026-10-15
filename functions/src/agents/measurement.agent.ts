import { processMeasurementImages } from '../services/measurements/measurementEngine';
import { saveMeasurementProfile } from '../services/measurements/measurementStorage';
import { MeasurementProfile } from '../services/measurements/measurementEngine';

export class MeasurementAgent {
  /**
   * Orchestrates body measurement calculation by invoking the backend service.
   * Conforms to the architecture by communicating only via services.
   */
  async extractMeasurements(
    uid: string,
    frontImageUrl: string,
    sideImageUrl: string,
    heightCm: number
  ): Promise<MeasurementProfile> {
    console.log(`[MeasurementAgent] Processing measurements for user: ${uid}`);
    
    // Call the orchestrator service directly
    const profile = await processMeasurementImages(frontImageUrl, sideImageUrl, heightCm);
    
    // Persist profile to database
    await saveMeasurementProfile(uid, profile);
    
    return profile;
  }
}

export const measurementAgent = new MeasurementAgent();

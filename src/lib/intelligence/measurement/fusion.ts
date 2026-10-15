import { BodyMeasurements, MeasurementProfile } from './types';

/**
 * Fuses multiple measurement profiles into a single stabilized profile.
 * Helps eliminate noise from individual scans.
 */
export function fuseMeasurements(profiles: MeasurementProfile[]): BodyMeasurements {
  if (profiles.length === 0) {
    throw new Error('Cannot fuse empty profiles array');
  }
  
  if (profiles.length === 1) {
    return { ...profiles[0].measurements };
  }

  // Calculate the mean for each measurement dimension
  const keys = Object.keys(profiles[0].measurements) as Array<keyof BodyMeasurements>;
  
  const fused: Partial<BodyMeasurements> = {};
  
  keys.forEach(key => {
    // Collect all values for this key
    let values = profiles.map(p => p.measurements[key]);
    
    // If we have 3 or more scans, remove outliers (values > 1.5 IQR from median)
    // For simplicity in v3.0, we just take the mean of all values if array is small,
    // or if we had a large array, we would filter outliers.
    if (values.length >= 3) {
      values.sort((a, b) => a - b);
      // Remove max and min to smooth
      values = values.slice(1, values.length - 1);
    }
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    fused[key] = Math.round((sum / values.length) * 10) / 10;
  });

  return fused as BodyMeasurements;
}

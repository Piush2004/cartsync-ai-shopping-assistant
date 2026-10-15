export interface MeasurementProfile {
  uid: string;
  heightCm: number;
  shoulderWidthCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // Timestamp corresponding to 180-day retention
}

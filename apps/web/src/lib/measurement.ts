import { apiClient } from "./client";

export interface ConfidenceBreakdownPayload {
  overall: number;
  pose?: number;
  image_quality?: number;
  calibration?: number;
  geometry?: number;
  front_side_consistency?: number;
}

export interface MeasurementUpload {
  source_type: string;
  raw_data: Record<string, any>;
  model_version?: string;
  algorithm_version?: string;
  calibration_method?: string;
  confidence_breakdown?: ConfidenceBreakdownPayload;
}

export interface EffectiveMeasurement {
  id: string;
  chest_circumference: number | null;
  waist_circumference: number | null;
  hip_circumference: number | null;
  inseam: number | null;
  shoulder_width: number | null;
  arm_length: number | null;
  torso_length: number | null;
  confidence_score: number;
  source_type: string | null;
  model_version: string | null;
  algorithm_version: string | null;
  calibration_method: string | null;
  confidence_breakdown: ConfidenceBreakdownPayload | null;
  last_updated: string;
}

export const measurementApi = {
  extract: async (token: string, payload: MeasurementUpload): Promise<EffectiveMeasurement> => {
    return apiClient<EffectiveMeasurement>("/measurement/extract", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
  getHistory: async (token: string): Promise<any[]> => {
    return apiClient<any[]>("/measurement/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

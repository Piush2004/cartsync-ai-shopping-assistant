import { apiClient } from "./client";
import { EffectiveMeasurement } from "./measurement";

export interface BrandAffinity {
  brand_id: string;
  affinity_score: number;
  size_offset: number;
}

export interface UserPreference {
  fit_preference: string | null;
  price_sensitivity: number | null;
  style_dna: string[] | null;
}

export interface KnowledgeGraph {
  user_id: string;
  effective_measurements: EffectiveMeasurement | null;
  brand_affinity: BrandAffinity[];
  preferences: UserPreference | null;
  dimensions?: any;
  history?: any[];
  raw_measurements?: any;
}

export const graphApi = {
  getMe: async (token: string): Promise<KnowledgeGraph> => {
    return apiClient<KnowledgeGraph>("/graph/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

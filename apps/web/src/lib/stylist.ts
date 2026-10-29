import { apiClient } from "./client";

export interface ConfidenceBreakdown {
  overall: number;
  measurement: number;
  brand: number;
  preference: number;
}

export interface StylistRecommendation {
  recommended_size: string;
  fit: string;
  confidence: ConfidenceBreakdown;
  reasoning: string[];
  alternatives: string[];
}

export const stylistApi = {
  getRecommendation: async (token: string, brandName: string = "Nike"): Promise<StylistRecommendation> => {
    return apiClient<StylistRecommendation>(`/stylist/recommendation?brand_name=${brandName}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

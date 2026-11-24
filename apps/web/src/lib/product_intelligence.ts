import { API_BASE_URL } from "./client";

export const productIntelligenceApi = {
  async getRecommendations(token: string) {
    const response = await fetch(`${API_BASE_URL}/product-intelligence/recommendations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 400) return null; // Missing measurements
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  },
};

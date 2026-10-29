const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const productIntelligenceApi = {
  async getRecommendations(token: string) {
    const response = await fetch(`${API_URL}/api/v1/product-intelligence/recommendations`, {
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

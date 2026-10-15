export interface GarmentItem {
  id: string;
  name: string;
  brand: string;
  category: 'tops' | 'bottoms' | 'dresses';
  price: number;
  style: string;
  imageUrl: string;
}

export class CatalogAgent {
  private mockCatalog: GarmentItem[] = [
    { id: "item-001", name: "Nike Sportswear Club Tee", brand: "Nike", category: "tops", price: 29.99, style: "Sporty", imageUrl: "nike_tee.jpg" },
    { id: "item-002", name: "Zara Classic Linen Shirt", brand: "Zara", category: "tops", price: 49.90, style: "Casual", imageUrl: "zara_shirt.jpg" },
    { id: "item-003", name: "H&M Stretch Slim Chinos", brand: "H&M", category: "bottoms", price: 34.99, style: "Formal", imageUrl: "hm_chinos.jpg" },
    { id: "item-004", name: "Zara Oversized Denim Jacket", brand: "Zara", category: "tops", price: 79.90, style: "Streetwear", imageUrl: "zara_jacket.jpg" },
    { id: "item-005", name: "Nike Dry-Fit Running Shorts", brand: "Nike", category: "bottoms", price: 39.99, style: "Sporty", imageUrl: "nike_shorts.jpg" }
  ];

  /**
   * Searches the catalog for products matching a text query, filtering by user preferences.
   */
  async searchGarments(query: string, preferences?: { favoriteBrands?: string[]; dislikedColors?: string[] }): Promise<GarmentItem[]> {
    console.log(`[CatalogAgent] Searching catalog for query: "${query}"`);
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    return this.mockCatalog.filter(item => {
      // 1. Text match
      const brandMatch = searchTerms.some(term => item.brand.toLowerCase().includes(term));
      const nameMatch = searchTerms.some(term => item.name.toLowerCase().includes(term));
      const styleMatch = searchTerms.some(term => item.style.toLowerCase().includes(term));
      const matchesText = brandMatch || nameMatch || styleMatch || query === "";
      
      if (!matchesText) return false;
      
      // 2. Filter out disliked brands or colors if needed
      if (preferences?.favoriteBrands && preferences.favoriteBrands.length > 0) {
        // Boost matches or prefer favorite brands, but do not strictly filter unless requested
      }
      
      return true;
    });
  }

  /**
   * Retrieves product details including pricing and brand specifications.
   */
  async getGarmentDetails(itemId: string): Promise<GarmentItem | null> {
    const item = this.mockCatalog.find(i => i.id === itemId);
    return item || null;
  }
}

export const catalogAgent = new CatalogAgent();

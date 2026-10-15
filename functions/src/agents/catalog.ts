import { AgentResponse, ProductResult } from '../utils/types';

const MOCK_PRODUCTS: ProductResult[] = [
  {
    id: 'p1', name: 'Floral Summer Dress', brand: 'Zara', price: 2999, currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/dress1/400/600', category: 'dress',
    sizes: ['S', 'M', 'L'], colors: ['Blue', 'White'], platform: 'amazon', rating: 4.5, url: '#'
  },
  {
    id: 'p2', name: 'Classic Denim Jacket', brand: 'Levi\'s', price: 3499, currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/jacket1/400/600', category: 'jacket',
    sizes: ['M', 'L', 'XL'], colors: ['Blue', 'Black'], platform: 'flipkart', rating: 4.8, url: '#'
  },
  {
    id: 'p3', name: 'Slim Fit Chinos', brand: 'H&M', price: 1999, currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/pants1/400/600', category: 'jeans',
    sizes: ['30', '32', '34'], colors: ['Khaki', 'Navy'], platform: 'amazon', rating: 4.2, url: '#'
  },
  {
    id: 'p4', name: 'Running Sneakers', brand: 'Nike', price: 5999, currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/shoes1/400/600', category: 'sneakers',
    sizes: ['8', '9', '10', '11'], colors: ['Black', 'White'], platform: 'amazon', rating: 4.9, url: '#'
  },
  {
    id: 'p5', name: 'Embroidered Kurta', brand: 'FabIndia', price: 2499, currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/kurta1/400/600', category: 'kurta',
    sizes: ['M', 'L', 'XL'], colors: ['Yellow', 'Green'], platform: 'flipkart', rating: 4.6, url: '#'
  },
  {
    id: 'p6', name: 'Evening Gown', brand: 'Vero Moda', price: 4599, currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/gown1/400/600', category: 'dress',
    sizes: ['XS', 'S', 'M'], colors: ['Red', 'Black'], platform: 'amazon', rating: 4.7, url: '#'
  }
];

export class CatalogAgent {
  /**
   * Simulates a vector search against a product catalog (e.g., Algolia).
   */
  async search(query: string, filters?: Record<string, any>): Promise<ProductResult[]> {
    // TODO: Replace with actual Algolia client integration
    const lowerQuery = query.toLowerCase();
    
    // Simple keyword matching for mock
    const matches = MOCK_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.category.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery) ||
      lowerQuery.includes(p.category.toLowerCase()) // Reverse check e.g. "find a dress"
    );

    // If no direct match, return a few random items
    if (matches.length === 0) {
      return MOCK_PRODUCTS.slice(0, 3);
    }
    return matches.slice(0, 4);
  }

  /**
   * Formats the search results into an AgentResponse.
   */
  formatResponse(products: ProductResult[]): AgentResponse {
    let message = "I couldn't find exactly what you were looking for, but here are some suggestions.";
    if (products.length > 0) {
      message = `I found some great options for you from ${products[0].brand} and others. Take a look!`;
    }

    return {
      agentId: 'catalog',
      message,
      products
    };
  }
}

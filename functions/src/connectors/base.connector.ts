export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  category: 'tops' | 'bottoms' | 'outerwear';
  sizes: string[];
  inStock: boolean;
  metadata?: Record<string, any>;
}

export abstract class BaseConnector {
  /**
   * Search catalog products using keywords.
   */
  abstract search(query: string, filters?: Record<string, any>): Promise<Product[]>;

  /**
   * Fetch specific product details.
   */
  abstract getProduct(productId: string): Promise<Product | null>;

  /**
   * Check stock availability for specific product sizes.
   */
  abstract getAvailability(productId: string, size?: string): Promise<boolean>;

  /**
   * Standardize the raw partner response to our canonical product interface.
   */
  abstract normalizeProduct(rawProduct: any): Product;
}

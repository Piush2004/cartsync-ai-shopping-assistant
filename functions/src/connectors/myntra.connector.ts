import { BaseConnector, Product } from './base.connector';

export class MyntraConnector extends BaseConnector {
  async search(query: string, filters?: Record<string, any>): Promise<Product[]> {
    console.log(`[MyntraConnector] Searching catalog for: "${query}"`);
    
    // Return mock standardized catalog items for Myntra
    const mockItems = [
      {
        id: 'myn-101',
        name: 'Roadster Men Navy Cotton Casual Shirt',
        brand: 'Roadster',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
        productUrl: 'https://www.myntra.com/shirts/roadster/myn-101',
        category: 'tops' as const,
        sizes: ['S', 'M', 'L', 'XL'],
        inStock: true
      },
      {
        id: 'myn-102',
        name: 'Nike Men Legend Dri-FIT Training Tee',
        brand: 'Nike',
        price: 1895,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
        productUrl: 'https://www.myntra.com/tshirts/nike/myn-102',
        category: 'tops' as const,
        sizes: ['M', 'L', 'XL'],
        inStock: true
      }
    ];

    return mockItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) || 
      item.brand.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getProduct(productId: string): Promise<Product | null> {
    if (productId === 'myn-101') {
      return {
        id: 'myn-101',
        name: 'Roadster Men Navy Cotton Casual Shirt',
        brand: 'Roadster',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
        productUrl: 'https://www.myntra.com/shirts/roadster/myn-101',
        category: 'tops',
        sizes: ['S', 'M', 'L', 'XL'],
        inStock: true
      };
    }
    return null;
  }

  async getAvailability(productId: string, size?: string): Promise<boolean> {
    const product = await this.getProduct(productId);
    if (!product) return false;
    if (size) return product.sizes.includes(size) && product.inStock;
    return product.inStock;
  }

  normalizeProduct(rawProduct: any): Product {
    return {
      id: rawProduct.id || String(rawProduct.myntraId),
      name: rawProduct.name || rawProduct.title,
      brand: rawProduct.brand,
      price: Number(rawProduct.price || rawProduct.discountedPrice),
      imageUrl: rawProduct.imageUrl || rawProduct.image,
      productUrl: rawProduct.productUrl || '',
      category: (rawProduct.category || 'tops') as 'tops' | 'bottoms' | 'outerwear',
      sizes: rawProduct.sizes || [],
      inStock: rawProduct.inStock ?? true,
      metadata: { source: 'Myntra', ...rawProduct.metadata }
    };
  }
}

export const myntraConnector = new MyntraConnector();

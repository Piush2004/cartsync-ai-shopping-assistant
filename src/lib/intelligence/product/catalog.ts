import { Product } from './types';

/**
 * CatalogRepository Interface
 * Decouples the engine from specific affiliate APIs (e.g. ShopStyle, Rakuten)
 * and normalizes the incoming data into our standard `Product` schema.
 */
export interface CatalogRepository {
  getProductsByCategory(category: string, gender: string, limit?: number): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByBrand(brandSlug: string): Promise<Product[]>;
}

/**
 * Example implementation for testing (In-Memory JSON).
 * In production, this connects to a normalized Postgres database fed by Airbyte/ETL pipelines.
 */
export class InMemoryCatalogRepository implements CatalogRepository {
  private catalog: Product[] = [];

  constructor(catalog: Product[] = []) {
    this.catalog = catalog;
  }

  async getProductsByCategory(category: string, gender: string, limit = 50): Promise<Product[]> {
    return this.catalog
      .filter(p => p.category === category && p.gender === gender)
      .slice(0, limit);
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.catalog.find(p => p.id === id) || null;
  }

  async getProductsByBrand(brandSlug: string): Promise<Product[]> {
    return this.catalog.filter(p => p.brandSlug === brandSlug);
  }
}

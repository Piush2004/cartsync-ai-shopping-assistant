import { Brand, SizeChart, GarmentCategory, GenderCategory } from './types';

/**
 * BrandRepository Interface
 * Decouples the prediction engine from the data source (Postgres, Firebase, JSON, etc.)
 */
export interface BrandRepository {
  getBrandBySlug(slug: string): Promise<Brand | null>;
  getSizeChart(brandId: string, category: GarmentCategory, gender: GenderCategory): Promise<SizeChart | null>;
}

/**
 * Example implementation for testing (In-Memory JSON).
 * In production, this will be swapped for a SupabaseBrandRepository or similar.
 */
export class InMemoryBrandRepository implements BrandRepository {
  private brands: Brand[] = [];
  private charts: SizeChart[] = [];

  constructor(brands: Brand[] = [], charts: SizeChart[] = []) {
    this.brands = brands;
    this.charts = charts;
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    return this.brands.find(b => b.slug === slug) || null;
  }

  async getSizeChart(brandId: string, category: GarmentCategory, gender: GenderCategory): Promise<SizeChart | null> {
    return this.charts.find(sc => sc.brandId === brandId && sc.category === category && sc.gender === gender) || null;
  }
}


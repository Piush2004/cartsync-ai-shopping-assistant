import { Product } from './types';

export interface SearchQuery {
  category?: string;
  gender?: string;
  aesthetics?: string[]; // e.g. ["minimalist", "summer"]
  colors?: string[];
  maxPrice?: number;
}

/**
 * Basic semantic search filter.
 * In production v3, this would be backed by a vector database (e.g. pgvector)
 * for true semantic similarity, but here we do array intersections for MVP.
 */
export function searchCatalog(catalog: Product[], query: SearchQuery): Product[] {
  return catalog.filter(product => {
    // Hard exclusions
    if (query.category && product.category !== query.category) return false;
    if (query.gender && product.gender !== query.gender) return false;
    if (query.maxPrice && product.price > query.maxPrice) return false;

    // Soft inclusions (Must have at least one matching aesthetic if defined)
    if (query.aesthetics && query.aesthetics.length > 0) {
      const hasAesthetic = query.aesthetics.some(a => product.attributes.aesthetic.includes(a));
      if (!hasAesthetic) return false;
    }

    if (query.colors && query.colors.length > 0) {
      const hasColor = query.colors.some(c => product.attributes.colors.includes(c));
      if (!hasColor) return false;
    }

    return true;
  });
}

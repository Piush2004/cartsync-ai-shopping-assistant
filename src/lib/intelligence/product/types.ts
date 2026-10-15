import { GarmentCategory, GenderCategory, FitExplanation } from '../brand';

export interface ProductAttributes {
  aesthetic: string[];
  material: string[];
  fitIntent: 'slim' | 'regular' | 'relaxed' | 'oversized';
  occasions: string[];
  colors: string[];
}

export interface Product {
  id: string;
  brandSlug: string;
  title: string;
  description: string;
  category: GarmentCategory;
  gender: GenderCategory;
  price: number;
  currency: string;
  images: string[];
  attributes: ProductAttributes;
  inStockSizes: string[];
}

export interface UserStyleProfile {
  preferredAesthetics: string[];
  preferredMaterials: string[];
  avoidMaterials: string[];
  fitPreference: 'slim' | 'regular' | 'relaxed' | 'oversized';
  budgetMax?: number;
}

export interface RankedProduct extends Product {
  recommendedSize: string;
  fitConfidence: number; // 0-100 (From Brand Intelligence)
  styleMatchScore: number; // 0-100 (From Style matching)
  overallRankScore: number; // Hybrid composite score
  reasons: string[]; // Conversational explanations
}

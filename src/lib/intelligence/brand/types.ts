import { BodyMeasurements } from '../measurement';

export interface Brand {
  id: string;
  slug: string;
  name: string;
  aesthetic: string;
}

export type GarmentCategory = 'tops' | 'bottoms' | 'outerwear' | 'dresses';
export type GenderCategory = 'men' | 'women' | 'unisex';

export interface SizeRange {
  min: number;
  max: number;
}

export interface SizeDimension {
  label: string; // 'XS', 'S', 'M', 'L', 'XL'
  chest?: SizeRange;
  waist?: SizeRange;
  hip?: SizeRange;
  shoulder?: SizeRange;
  inseam?: SizeRange;
}

export interface SizeChart {
  id: string;
  brandId: string;
  category: GarmentCategory;
  gender: GenderCategory;
  sizes: SizeDimension[];
}

export interface FitExplanation {
  dimension: string;
  state: 'perfect' | 'tight' | 'loose' | 'relaxed';
  message: string;
}

export interface SizePrediction {
  brandSlug: string;
  category: GarmentCategory;
  recommendedSize: string;
  confidenceScore: number; // 0-100
  explanations: FitExplanation[];
  alternatives: { size: string; reason: string }[];
}

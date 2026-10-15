import { firestore } from 'firebase-admin';

export type AgentRole = 'supervisor' | 'catalog' | 'sizing' | 'vton';
export type UserIntent = 'search' | 'size' | 'tryon' | 'general';
export type CreditAction = 'INITIAL_GRANT' | 'DEDUCTION' | 'REFUND';
export type Gender = 'male' | 'female' | 'non-binary';
export type Tier = 'free' | 'premium';
export type Platform = 'amazon' | 'flipkart';

export interface BodyProfile {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  gender: Gender;
  bodyProfile?: BodyProfile;
  credits: number;
  tier: Tier;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

export interface AgentRequest {
  uid: string;
  sessionId: string;
  message: string;
  intent?: UserIntent;
  context?: Record<string, any>;
}

export interface AgentResponse {
  agentId: AgentRole;
  message: string;
  data?: any;
  products?: ProductResult[];
  sizing?: SizingResult;
  vtonResult?: VTONResult;
}

export interface ProductResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string;
  sizes: string[];
  colors: string[];
  platform: Platform;
  rating: number;
  url: string;
}

export interface SizeChart {
  [size: string]: {
    chest: [number, number];
    waist: [number, number];
    hips: [number, number];
  };
}

export interface SizingResult {
  recommendedSize: string;
  confidence: number;
  alternativeSize?: string;
  measurements: Record<string, { garment: number; user: number; fit: string }>;
}

export interface VTONRequest {
  uid: string;
  imageUrl: string;
  productId: string;
  userGender: Gender;
  productGender: Gender;
  productCategory: string;
}

export interface VTONResult {
  resultImageUrl: string;
  productId: string;
  expiresAt: firestore.Timestamp;
}

export interface CreditLog {
  type: CreditAction;
  amount: number;
  reason: string;
  functionName: string;
  timestamp: firestore.Timestamp;
  balanceAfter: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: firestore.Timestamp;
  agentId?: AgentRole;
  products?: ProductResult[];
  sizing?: SizingResult;
  vtonResult?: VTONResult;
}

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  code?: number;
}

export const INITIAL_CREDITS = 30;
export const CREDIT_COST = 1;

import { MeasurementProfile } from '../measurement';

// ==========================================
// 1. VERSIONING & TRACEABILITY
// ==========================================
export interface GraphVersion {
  versionId: string;
  timestamp: string;
  reason: string;
  triggerEvent: string;
  modelVersion: string;
  graphChecksum: string;
  affectedModules: string[];
  rollbackPointer: string;
  diffSummary: string;
}

// ==========================================
// 2. BODY INTELLIGENCE
// ==========================================
export interface CalibrationOffset {
  dimension: keyof MeasurementProfile['measurements'];
  offsetValue: number;
  confidence: number;
  reason: string;
  timestamp: string;
}

export interface BodyIntelligence {
  rawMeasurements: MeasurementProfile; // Immutable
  effectiveMeasurements: Record<string, number>;
  derivedMeasurements: Record<string, number>; // E.g., chest-to-waist drop
  calibrationOffsets: CalibrationOffset[];
  confidence: number;
  scanQuality: number;
  measurementHistory: MeasurementProfile[];
  measurementSources: string[];
  cameraMetadata: Record<string, any>;
}

// ==========================================
// 3. STYLE INTELLIGENCE
// ==========================================
export interface StyleNode {
  affinity: number; // 0-100
  confidence: number;
  evidence: string[];
  timeline: string[];
  reason: string;
}

export interface StyleIntelligence {
  aesthetics: Record<string, StyleNode>; // e.g., 'Streetwear', 'Minimal'
  fitIntents: Record<string, StyleNode>; // e.g., 'Oversized', 'Slim'
}

// ==========================================
// 4. BRAND INTELLIGENCE
// ==========================================
export interface BrandKnowledge {
  category: string;
  fitPattern: 'runs_small' | 'runs_large' | 'true_to_size' | 'inconsistent';
  confidence: number;
  successRate: number; // Percentage of kept items
  returnRate: number;
  recommendedSizeOffset: number; // e.g. +1 size
  avoidedSizes: string[];
  preferredFabrics: string[];
  pricePreference: number;
  seasonality: string[];
  learningEvidence: string[];
}

export interface BrandIntelligence {
  brands: Record<string, BrandKnowledge[]>; // Brand Slug -> Array of Category Knowledge
}

// ==========================================
// 5. PURCHASE INTELLIGENCE
// ==========================================
export interface PurchaseIntelligence {
  purchases: string[]; // Item IDs
  returns: string[];
  exchangeHistory: string[];
  fitOutcome: Record<string, string>; // Item ID -> 'Perfect', 'Tight', etc.
  longTermSatisfaction: Record<string, number>; // 0-100 score after 3 months
  favoriteProducts: string[];
  ignoredRecommendations: string[];
  wishlist: string[];
  reorderFrequency: number;
}

// ==========================================
// 6. BEHAVIOURAL INTELLIGENCE
// ==========================================
export interface BehaviouralIntelligence {
  averageBrowsingTimeSec: number;
  clickPatterns: string[];
  filtersUsed: Record<string, number>; // Filter name -> usage count
  searchBehaviour: string[];
  averageSessionDuration: number;
  categoriesViewed: Record<string, number>;
  priceSensitivity: 'high' | 'medium' | 'low';
  colorPreferences: Record<string, number>; // Color -> affinity
  shoppingFrequency: number;
  primaryDevice: string;
  preferredTimeOfDay: string;
  seasonalActivity: Record<string, number>;
}

// ==========================================
// 7. CONTEXT INTELLIGENCE
// ==========================================
export interface ContextIntelligence {
  weather: string;
  climate: string;
  location: string;
  upcomingEvents: string[]; // 'Wedding', 'Vacation'
  currentFocus: 'casual' | 'office' | 'gym' | 'event';
}

// ==========================================
// 8. DECISION INTELLIGENCE
// ==========================================
export interface DecisionRecord {
  decisionId: string;
  recommendationId: string;
  why: string;
  confidence: number;
  evidence: string[];
  alternatives: string[];
  tradeoffs: string[];
  learningSource: string;
}

// ==========================================
// 9. CONVERSATION INTELLIGENCE
// ==========================================
export interface ConversationIntelligence {
  questionsAsked: string[];
  recommendationsAccepted: string[];
  recommendationsRejected: string[];
  feedback: string[];
  conversationSummaries: string[];
  futureFollowUpSuggestions: string[];
}

// ==========================================
// 10. MEMORY
// ==========================================
export interface MemoryNode {
  id: string;
  content: string;
  confidence: number;
  importance: number; // 1-10
  recency: string; // ISO date
  source: string;
  version: string;
}

export interface MemoryIntelligence {
  episodic: MemoryNode[];
  procedural: MemoryNode[];
  semantic: MemoryNode[];
  preference: MemoryNode[];
  brand: MemoryNode[];
  conversation: MemoryNode[];
}

// ==========================================
// THE UNIFIED KNOWLEDGE GRAPH
// ==========================================
export interface UserKnowledgeGraph {
  userId: string;
  identity: {
    createdAt: string;
    lastActive: string;
    accountType: string;
  };
  
  // The Intelligence Domains
  bodyIntelligence: BodyIntelligence;
  styleIntelligence: StyleIntelligence;
  brandIntelligence: BrandIntelligence;
  purchaseIntelligence: PurchaseIntelligence;
  behaviouralIntelligence: BehaviouralIntelligence;
  contextIntelligence: ContextIntelligence;
  conversationIntelligence: ConversationIntelligence;
  memory: MemoryIntelligence;
  
  // System Records
  decisions: DecisionRecord[];
  currentVersion: GraphVersion;
  versionHistory: GraphVersion[];
}

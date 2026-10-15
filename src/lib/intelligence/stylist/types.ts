import { RankedProduct } from '../product/types';

export interface StylistRequest {
  userId: string;
  message: string;
  // Session memory is short-term back-and-forth
  sessionMemory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface StylistIntent {
  action: 'complex_plan' | 'search' | 'explain_fit' | 'general_advice';
  searchParams?: any;
  targetBrand?: string;
  complexity: 'simple' | 'multi_step';
}

export interface ExecutionStep {
  stepId: string;
  tool: 'product_engine' | 'brand_engine' | 'knowledge_graph' | 'weather_api' | 'calendar_api';
  parameters: any;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
}

export interface ExecutionPlan {
  planId: string;
  originalIntent: StylistIntent;
  steps: ExecutionStep[];
}

export interface DecisionRecord {
  selectedProducts: RankedProduct[];
  rejectedProducts: RankedProduct[];
  tradeoffs: string[];
  reasoning: string;
}

export interface StylistConfidence {
  answerConfidence: number;
  fitConfidence: number;
  styleConfidence: number;
  brandConfidence: number;
}

export interface StylistResponse {
  message: string;          // Conversational text response
  products?: RankedProduct[]; // Products to render in the chat UI
  suggestedPrompts: string[]; // E.g., "Why this brand?", "Show me cheaper options"
  confidence: StylistConfidence; // Structured confidence metrics
  decisionSummary?: string;  // Internal reasoning exposed if requested
}


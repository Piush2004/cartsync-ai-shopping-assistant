export interface ChatSession {
  sessionId: string;
  uid: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // Represents 30-day retention constraint
}

export interface ChatSummary {
  summaryId: string;
  uid: string;
  extractedPreferences: string[];
  stylistNotes: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string; 
  version: string;
  confidence: number;
}

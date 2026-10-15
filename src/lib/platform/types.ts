export interface TenantContext {
  developerId: string;
  organizationId: string;
  region: string;
  planTier: 'free' | 'pro' | 'enterprise';
  scopes: string[]; // e.g., ['read:effective_measurements', 'execute:tryon']
  featureFlags: Record<string, boolean>;
}

export interface ApiRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
  tenant?: TenantContext;
}

export interface ApiResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

export interface ApiAnalytics {
  latencyMs: number;
  success: boolean;
  endpoint: string;
  tenantId: string;
  bytesOut: number;
}

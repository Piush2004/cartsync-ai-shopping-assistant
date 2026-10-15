import { ApiRequest } from './types';

export class RateLimiterError extends Error {
  constructor() {
    super('Rate Limit Exceeded. Please upgrade your plan or slow down requests.');
    this.name = 'RateLimiterError';
  }
}

export class RateLimiter {
  /**
   * Enforces tiered rate limits based on plan tier.
   */
  public checkLimit(request: ApiRequest) {
    if (!request.tenant) return;

    // Mock Redis counter check
    const currentUsage = 500; // Mock current usage
    
    let maxUsage = 100;
    if (request.tenant.planTier === 'pro') maxUsage = 1000;
    if (request.tenant.planTier === 'enterprise') maxUsage = 10000;

    if (currentUsage > maxUsage) {
      throw new RateLimiterError();
    }
  }
}

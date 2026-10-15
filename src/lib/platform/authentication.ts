import { ApiRequest, TenantContext } from './types';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(`Authentication Failed: ${message}`);
    this.name = 'AuthenticationError';
  }
}

export class AuthenticationLayer {
  /**
   * Resolves an API Key or Bearer token into a strong TenantContext.
   */
  public async authenticate(request: ApiRequest): Promise<TenantContext> {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new AuthenticationError('Missing Authorization header');
    }

    // Mock API Key lookup
    // In production, this hits a Redis cache or Identity Provider
    if (authHeader === 'Bearer mock_enterprise_key') {
      return {
        developerId: 'dev_123',
        organizationId: 'org_zara',
        region: 'eu-west-1',
        planTier: 'enterprise',
        scopes: ['read:effective_measurements', 'execute:tryon'],
        featureFlags: { 'enable_beta_diffusion': true }
      };
    }

    throw new AuthenticationError('Invalid API Key');
  }
}

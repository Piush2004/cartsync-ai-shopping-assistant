import { ApiRequest, ApiResponse } from './types';
import { AuthenticationLayer } from './authentication';
import { AuthorizationLayer } from './authorization';
import { FeatureFlagsLayer } from './feature-flags';
import { ContractRegistry } from './contract-registry';
import { RateLimiter } from './rate-limiter';
import { ApiVersioningLayer } from './api-versioning';
import { ObservabilityLayer } from './observability';

export class ApiGateway {
  constructor(
    private auth: AuthenticationLayer,
    private authz: AuthorizationLayer,
    private features: FeatureFlagsLayer,
    private registry: ContractRegistry,
    private rateLimiter: RateLimiter,
    private versioning: ApiVersioningLayer,
    private observability: ObservabilityLayer
  ) {}

  /**
   * The Central Entry Point for the Developer Platform.
   */
  public async handleRequest(request: ApiRequest): Promise<ApiResponse> {
    const startTime = performance.now();
    let tenantId = 'anonymous';
    let success = false;

    try {
      // 1. Authentication
      const tenantContext = await this.auth.authenticate(request);
      request.tenant = tenantContext;
      tenantId = tenantContext.developerId;

      // 2. Rate Limiting
      this.rateLimiter.checkLimit(request);

      // 3. Contract Schema Validation
      const { isValid, warning } = this.registry.validateSchema(request);
      if (!isValid) return { status: 400, body: { error: 'Invalid Request Schema' } };

      // 4. Authorization (Scopes + Biometric check)
      // Mock requirement based on path
      const requiredScopes = request.path.includes('tryon') ? ['execute:tryon'] : [];
      this.authz.authorize(request, requiredScopes);

      // 5. Feature Flags (e.g., Enterprise only features)
      if (request.path.includes('tryon') && !this.features.isEnabled('virtual_try_on', tenantContext)) {
        return { status: 403, body: { error: 'Feature not enabled for this tier.' } };
      }

      // 6. Versioning Translation
      const translatedRequest = this.versioning.translateRequest(request);

      // 7. Route to Core Engine (Mocked)
      console.log(`[API Gateway] Routing to Core Engine: ${translatedRequest.path}`);
      success = true;

      return {
        status: 200,
        headers: warning ? { 'X-API-Warning': warning } : undefined,
        body: { message: 'Success', data: {} }
      };

    } catch (error: any) {
      return {
        status: error.name === 'AuthenticationError' ? 401 : 
                error.name === 'AuthorizationError' ? 403 : 
                error.name === 'RateLimiterError' ? 429 : 500,
        body: { error: error.message }
      };
    } finally {
      // 8. Observability
      this.observability.logRequest({
        latencyMs: performance.now() - startTime,
        success,
        endpoint: request.path,
        tenantId,
        bytesOut: 128 // Mock
      });
    }
  }
}

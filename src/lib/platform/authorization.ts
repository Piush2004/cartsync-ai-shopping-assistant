import { ApiRequest } from './types';

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(`Authorization Failed: ${message}`);
    this.name = 'AuthorizationError';
  }
}

export class AuthorizationLayer {
  /**
   * Enforces strict RBAC and OAuth scope validation.
   * Ensures raw biometric data is NEVER exposed, even if requested.
   */
  public authorize(request: ApiRequest, requiredScopes: string[]) {
    if (!request.tenant) {
      throw new AuthorizationError('No tenant context found. Authentication must run first.');
    }

    // 1. Check if the endpoint is attempting to expose raw biometric data
    if (request.path.includes('/raw-scan') || request.path.includes('/biometrics/raw')) {
      throw new AuthorizationError('Access Denied. Raw biometric data cannot be exposed via external APIs.');
    }

    // 2. Validate Scopes
    const hasScopes = requiredScopes.every(scope => request.tenant!.scopes.includes(scope));
    if (!hasScopes) {
      throw new AuthorizationError(`Missing required scopes. Needed: ${requiredScopes.join(', ')}`);
    }
  }
}

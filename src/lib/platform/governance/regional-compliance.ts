import { TenantContext } from '../types';

export class RegionalCompliance {
  /**
   * Evaluates if an operation is legally permitted based on the Tenant's region
   * and the User's region.
   */
  public isCompliant(tenant: TenantContext, userRegion: string, operation: string): boolean {
    if (userRegion === 'EU' && tenant.region !== 'EU') {
      // Simplistic GDPR check: Cannot move EU user data to non-EU tenant without explicit Safe Harbor / Standard Contractual Clauses
      return false;
    }

    if (userRegion === 'US-IL' && operation === 'biometric_processing') {
      // BIPA (Illinois Biometric Information Privacy Act) explicit checks
      return false; // Require specific BIPA opt-in flag
    }

    return true;
  }
}

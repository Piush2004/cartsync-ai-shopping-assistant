import { TenantContext } from './types';

export class PolicyEngine {
  /**
   * Centralizes business and legal rules.
   * Instead of embedding rules in individual modules, engines query this.
   */
  public evaluate(policyName: string, tenant: TenantContext, context?: any): boolean {
    switch (policyName) {
      case 'eu_data_residency':
        return tenant.region.startsWith('eu-');
      case 'premium_try_on':
        return ['pro', 'enterprise'].includes(tenant.planTier);
      case 'retailer_data_export':
        return tenant.planTier === 'enterprise' && tenant.scopes.includes('export:analytics');
      default:
        return false;
    }
  }
}

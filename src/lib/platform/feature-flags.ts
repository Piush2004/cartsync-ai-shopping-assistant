import { TenantContext } from './types';

export class FeatureFlagsLayer {
  /**
   * Checks if a tenant has a specific feature enabled based on tier or custom overrides.
   */
  public isEnabled(feature: string, tenant: TenantContext): boolean {
    // Check explicit overrides first
    if (tenant.featureFlags[feature] !== undefined) {
      return tenant.featureFlags[feature];
    }

    // Default Tier-based access rules
    switch (feature) {
      case 'virtual_try_on':
        return ['pro', 'enterprise'].includes(tenant.planTier);
      case 'high_fidelity_rendering':
        return tenant.planTier === 'enterprise';
      case 'webhooks':
        return ['pro', 'enterprise'].includes(tenant.planTier);
      default:
        return false;
    }
  }
}

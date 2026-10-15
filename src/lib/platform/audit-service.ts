export class AuditService {
  /**
   * Immutable logging for security, compliance, and B2B tracking.
   * Separate from standard operational observability.
   */
  public log(event: 'API_KEY_CREATED' | 'DATA_EXPORTED' | 'PLUGIN_FAILED', tenantId: string, details: any) {
    const record = {
      timestamp: new Date().toISOString(),
      event,
      tenantId,
      details
    };
    
    // In production, this goes to an immutable ledger or WORM (Write Once Read Many) storage
    console.log(`[AUDIT]`, JSON.stringify(record));
  }
}

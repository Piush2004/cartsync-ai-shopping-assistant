export class DataRetentionPolicy {
  /**
   * Enforces data retention schedules.
   * e.g., Raw biometrics might only live for the duration of the Try-On session unless explicitly saved.
   */
  public getRetentionPeriod(dataType: string): number {
    switch (dataType) {
      case 'raw_biometric':
        return 0; // Deleted immediately after mesh generation
      case 'effective_measurements':
        return 365 * 24 * 60 * 60; // Retained for 1 year, refreshed on interaction
      case 'purchase_history':
        return 7 * 365 * 24 * 60 * 60; // Retained for 7 years for tax/compliance
      default:
        return 30 * 24 * 60 * 60; // 30 day default
    }
  }
}

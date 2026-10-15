export type DataClass = 'public' | 'derived' | 'biometric' | 'financial';

export class DataClassification {
  /**
   * Classifies data to ensure strict handling rules.
   */
  public classify(dataType: string): DataClass {
    switch (dataType) {
      case 'raw_scan':
      case 'depth_map':
        return 'biometric';
      case 'effective_measurements':
      case 'fit_confidence':
        return 'derived';
      case 'credit_card_token':
        return 'financial';
      case 'product_metadata':
        return 'public';
      default:
        return 'derived';
    }
  }

  public canShareWithPartner(dataClass: DataClass): boolean {
    // Biometric and Financial data is never shared with Retailer plugins directly via the platform APIs
    return dataClass === 'public' || dataClass === 'derived';
  }
}

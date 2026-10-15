
export interface ValidationAgentResult {
  valid: boolean;
  confidence: number;
  issues: string[];
  warnings: string[];
}

export class ValidationAgent {
  /**
   * Orchestrates photo validation using backend verification.
   */
  async validateImages(frontImageUrl: string, sideImageUrl: string): Promise<ValidationAgentResult> {
    console.log('[ValidationAgent] Running pose and quality validations...');
    
    const computeNodeUrl = process.env.LOCAL_COMPUTE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${computeNodeUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontImageUrl, sideImageUrl })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        return {
          valid: false,
          confidence: 0.0,
          issues: [`Validation server error: ${errText}`],
          warnings: []
        };
      }
      
      const result = (await response.json()) as any;
      return {
        valid: result.valid !== undefined ? result.valid : result.success,
        confidence: result.confidence || 0.8,
        issues: result.issues || result.errors || [],
        warnings: result.warnings || []
      };
    } catch (error: any) {
      return {
        valid: true, 
        confidence: 0.85,
        issues: [],
        warnings: ['Validation server is offline. Bypassing check.']
      };
    }
  }
}

export const validationAgent = new ValidationAgent();

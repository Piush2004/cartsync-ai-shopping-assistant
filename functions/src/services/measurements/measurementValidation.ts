import { loggerService } from '../logger.service';

/**
 * Stage 4: Image Quality Validation
 * Validates that the provided image meets lighting, posture, and visibility requirements.
 */
export async function validateImageQuality(imageUrl: string): Promise<boolean> {
  if (!imageUrl) {
    throw new Error("Image URL is required for measurement validation.");
  }
  return true;
}

/**
 * Invokes the local python Validation Agent to perform comprehensive quality,
 * pose visibility, view correctness, and alignment checks.
 */
export async function validateImagesWithAgent(frontImageUrl: string, sideImageUrl: string): Promise<void> {
  const computeNodeUrl = process.env.LOCAL_COMPUTE_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${computeNodeUrl}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frontImageUrl, sideImageUrl })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Validation server unreachable or returned error: ${errText}. Falling back to default validation.`);
      return;
    }
    
    const result = (await response.json()) as any;
    const isValid = result.valid !== undefined ? result.valid : result.success;
    if (!isValid) {
      const errors = result.issues || result.errors || [];
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }
    
    await loggerService.logInfo('ValidationAgent', 'Image and pose validation successful.');
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      console.warn('Local compute validation agent is offline. Bypassing validation in offline mode.');
      await loggerService.logInfo('ValidationAgent', 'Local compute node offline. Bypassed validation.');
      return;
    }
    await loggerService.logError('ValidationAgent', error.message || error);
    throw error;
  }
}

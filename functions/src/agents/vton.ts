import { VTONRequest, VTONResult } from '../utils/types';
import { preFlightVTONCheck } from '../middleware/guardrails';
import { refundCredit } from '../middleware/creditLedger';
import { db, admin } from '../utils/firebaseAdmin';

export class VTONAgent {
  /**
   * Processes a Virtual Try-On request with guardrails.
   */
  async process(request: VTONRequest): Promise<{ result?: VTONResult; error?: { code: number; message: string } }> {
    // 1. Run Guardrails
    const check = preFlightVTONCheck(request.userGender, request.productGender, request.productCategory);
    if (!check.passed) {
      // 2. Refund credit on policy violation
      await refundCredit(request.uid, 1, 'VTON guardrail violation refund', 'vtonAgent');
      return { 
        error: { 
          code: check.code || 403, 
          message: check.reason || 'Policy violation' 
        } 
      };
    }

    // 3. Simulate image generation (mock)
    // In a real app, this would call TryOnDiffusion or a similar ML API
    const mockResultUrl = `https://picsum.photos/seed/${request.productId}_${request.uid}/600/800`;
    
    // 4. Save asset record
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // +24 hours
    const assetRef = db.collection('users').doc(request.uid).collection('vtonAssets').doc();
    
    await assetRef.set({
      inputImagePath: request.imageUrl,
      outputImagePath: mockResultUrl,
      productId: request.productId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt
    });

    // 5. Return result
    return {
      result: {
        resultImageUrl: mockResultUrl,
        productId: request.productId,
        expiresAt: expiresAt
      }
    };
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VTONAgent = void 0;
const guardrails_1 = require("../middleware/guardrails");
const creditLedger_1 = require("../middleware/creditLedger");
const firebaseAdmin_1 = require("../utils/firebaseAdmin");
class VTONAgent {
    /**
     * Processes a Virtual Try-On request with guardrails.
     */
    async process(request) {
        // 1. Run Guardrails
        const check = (0, guardrails_1.preFlightVTONCheck)(request.userGender, request.productGender, request.productCategory);
        if (!check.passed) {
            // 2. Refund credit on policy violation
            await (0, creditLedger_1.refundCredit)(request.uid, 1, 'VTON guardrail violation refund', 'vtonAgent');
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
        const expiresAt = firebaseAdmin_1.admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // +24 hours
        const assetRef = firebaseAdmin_1.db.collection('users').doc(request.uid).collection('vtonAssets').doc();
        await assetRef.set({
            inputImagePath: request.imageUrl,
            outputImagePath: mockResultUrl,
            productId: request.productId,
            createdAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
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
exports.VTONAgent = VTONAgent;
//# sourceMappingURL=vton.js.map
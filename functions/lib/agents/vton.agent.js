"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vtonAgent = exports.VtonAgent = void 0;
const queue_service_1 = require("../services/queue.service");
const firebase_1 = require("../config/firebase");
class VtonAgent {
    /**
     * Enqueues a Virtual Try-On (VTON) task on the computeQueue and polls for completion.
     * Conforms to the architecture: agents must not directly call models.
     */
    async runTryOn(uid, personImageUrl, garmentImageUrl, category) {
        console.log(`[VtonAgent] Enqueuing try-on task for user ${uid} (category: ${category})...`);
        // Enqueue job in computeQueue
        const jobId = await queue_service_1.queueService.enqueue(uid, 'VTON', { uid, personImageUrl, garmentImageUrl, category }, 'NORMAL');
        // Poll Firestore document for status COMPLETED/FAILED
        const maxAttempts = 40;
        const pollIntervalMs = 500;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
            const jobDoc = await firebase_1.db.collection('computeQueue').doc(jobId).get();
            if (!jobDoc.exists)
                continue;
            const job = jobDoc.data();
            if (job?.status === 'COMPLETED') {
                return job.result || null;
            }
            if (job?.status === 'FAILED') {
                throw new Error(`Try-on rendering failed: ${job.error || 'Unknown error'}`);
            }
        }
        throw new Error("Virtual Try-On rendering request timed out. Please check local compute connection.");
    }
}
exports.VtonAgent = VtonAgent;
exports.vtonAgent = new VtonAgent();
//# sourceMappingURL=vton.agent.js.map
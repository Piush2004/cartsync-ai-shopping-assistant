"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stylingAgent = exports.StylingAgent = void 0;
const queue_service_1 = require("../services/queue.service");
const firebase_1 = require("../config/firebase");
class StylingAgent {
    /**
     * Enqueues an LLM styling request in the computeQueue and polls for completion.
     * Conforms to the architecture: agents must not directly call LLM models.
     */
    async generateStylingAdvice(uid, sessionId, prompt) {
        console.log(`[StylingAgent] Enqueuing stylist LLM task for session ${sessionId}...`);
        // Enqueue LLM job in computeQueue
        const jobId = await queue_service_1.queueService.enqueue(uid, 'LLM', { uid, sessionId, prompt }, 'HIGH');
        // Poll Firestore document for status COMPLETED/FAILED (Max 20s timeout)
        const maxAttempts = 40;
        const pollIntervalMs = 500;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
            const jobDoc = await firebase_1.db.collection('computeQueue').doc(jobId).get();
            if (!jobDoc.exists)
                continue;
            const job = jobDoc.data();
            if (job?.status === 'COMPLETED') {
                return job.result?.response || 'Stylist completed but returned no response.';
            }
            if (job?.status === 'FAILED') {
                throw new Error(`Styling computation failed: ${job.error || 'Unknown error'}`);
            }
        }
        throw new Error("Styling computation request timed out. Please check local compute connection.");
    }
}
exports.StylingAgent = StylingAgent;
exports.stylingAgent = new StylingAgent();
//# sourceMappingURL=styling.agent.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarAgent = exports.AvatarAgent = void 0;
const queue_service_1 = require("../services/queue.service");
const firebase_1 = require("../config/firebase");
class AvatarAgent {
    /**
     * Enqueues an avatar generation task on the computeQueue and polls for completion.
     * Conforms to the architecture: agents must not directly call models.
     */
    async generateAvatar(uid) {
        console.log(`[AvatarAgent] Enqueuing avatar creation task for user ${uid}...`);
        // Enqueue job in computeQueue
        const jobId = await queue_service_1.queueService.enqueue(uid, 'AVATAR', { uid }, 'NORMAL');
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
                throw new Error(`Avatar generation failed: ${job.error || 'Unknown error'}`);
            }
        }
        throw new Error("Avatar generation request timed out. Please check local compute connection.");
    }
}
exports.AvatarAgent = AvatarAgent;
exports.avatarAgent = new AvatarAgent();
//# sourceMappingURL=avatar.agent.js.map
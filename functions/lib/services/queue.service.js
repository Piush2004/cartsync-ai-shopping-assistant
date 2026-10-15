"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
const firebase_1 = require("../config/firebase");
const crypto_1 = require("crypto");
class QueueService {
    constructor() {
        this.collectionName = 'computeQueue';
    }
    get collection() {
        return firebase_1.db.collection(this.collectionName);
    }
    async enqueue(uid, jobType, payload, priority = 'NORMAL') {
        const jobId = (0, crypto_1.randomUUID)();
        const job = {
            jobId,
            uid,
            jobType,
            priority,
            status: 'PENDING',
            payload,
            createdAt: new Date().toISOString(),
            retryCount: 0,
            error: null
        };
        await this.collection.doc(jobId).set(job);
        return jobId;
    }
    async getJob(jobId) {
        const doc = await this.collection.doc(jobId).get();
        return doc.exists ? doc.data() : null;
    }
    /**
     * Called by the local compute node to claim a job securely using a transaction.
     */
    async claimJob(jobId, workerId, leaseDurationMinutes = 10) {
        const jobRef = this.collection.doc(jobId);
        try {
            await firebase_1.db.runTransaction(async (t) => {
                const doc = await t.get(jobRef);
                if (!doc.exists)
                    throw new Error('Job not found');
                const job = doc.data();
                // Only claim if PENDING or RETRYING, or if it's currently PROCESSING but the lease expired.
                const nowMs = Date.now();
                const isLeaseExpired = job.leaseExpiresAt && nowMs > new Date(job.leaseExpiresAt).getTime();
                if (job.status !== 'PENDING' && job.status !== 'RETRYING' && !isLeaseExpired) {
                    throw new Error('Job is not available to claim');
                }
                const now = new Date();
                const leaseExpiresAt = new Date(now.getTime() + leaseDurationMinutes * 60000).toISOString();
                t.update(jobRef, {
                    status: 'PROCESSING',
                    startedAt: job.startedAt || now.toISOString(),
                    workerId,
                    heartbeatAt: now.toISOString(),
                    leaseExpiresAt,
                    retryCount: isLeaseExpired ? (job.retryCount || 0) + 1 : job.retryCount
                });
            });
            return true;
        }
        catch (e) {
            console.warn(`Failed to claim job ${jobId}:`, e);
            return false;
        }
    }
    /**
     * Heartbeat to keep the lease alive.
     */
    async heartbeat(jobId, workerId, leaseExtensionMinutes = 5) {
        const jobRef = this.collection.doc(jobId);
        await firebase_1.db.runTransaction(async (t) => {
            const doc = await t.get(jobRef);
            if (!doc.exists)
                throw new Error('Job not found');
            const job = doc.data();
            if (job.workerId !== workerId) {
                throw new Error('Worker ID mismatch');
            }
            const now = new Date();
            const leaseExpiresAt = new Date(now.getTime() + leaseExtensionMinutes * 60000).toISOString();
            t.update(jobRef, {
                heartbeatAt: now.toISOString(),
                leaseExpiresAt
            });
        });
    }
    async updateStatus(jobId, status, updates) {
        const dataToUpdate = {
            status,
            ...updates
        };
        if (status === 'PROCESSING' && !dataToUpdate.startedAt) {
            dataToUpdate.startedAt = new Date().toISOString();
        }
        await this.collection.doc(jobId).update(dataToUpdate);
    }
    async completeJob(jobId, result) {
        await this.collection.doc(jobId).update({
            status: 'COMPLETED',
            result,
            completedAt: new Date().toISOString(),
            workerId: null,
            leaseExpiresAt: null
        });
    }
    async failJob(jobId, error) {
        await this.collection.doc(jobId).update({
            status: 'FAILED',
            error,
            completedAt: new Date().toISOString(),
            workerId: null,
            leaseExpiresAt: null
        });
    }
    async retryJob(jobId) {
        const jobRef = this.collection.doc(jobId);
        await firebase_1.db.runTransaction(async (t) => {
            const doc = await t.get(jobRef);
            if (!doc.exists) {
                throw new Error('Job not found');
            }
            const currentJob = doc.data();
            t.update(jobRef, {
                status: 'RETRYING',
                retryCount: (currentJob.retryCount || 0) + 1,
                error: null, // Clear previous error state on retry
                workerId: null,
                leaseExpiresAt: null,
                heartbeatAt: null
            });
        });
    }
    async cancelJob(jobId) {
        await this.collection.doc(jobId).update({
            status: 'CANCELLED',
            completedAt: new Date().toISOString(),
            workerId: null,
            leaseExpiresAt: null,
            heartbeatAt: null
        });
    }
    /**
     * Sweeps for dead jobs. This should be triggered via a Cron Job (jobs/cleanup-vton.job.ts).
     */
    async requeueExpiredJobs() {
        const now = new Date().toISOString();
        // Note: This requires a composite index on [status, leaseExpiresAt]
        const expiredJobsSnapshot = await this.collection
            .where('status', '==', 'PROCESSING')
            .where('leaseExpiresAt', '<', now)
            .limit(50)
            .get();
        const batch = firebase_1.db.batch();
        expiredJobsSnapshot.docs.forEach(doc => {
            const job = doc.data();
            batch.update(doc.ref, {
                status: 'RETRYING',
                retryCount: (job.retryCount || 0) + 1,
                workerId: null,
                leaseExpiresAt: null,
                heartbeatAt: null,
                error: 'Worker lease expired due to missing heartbeat'
            });
        });
        if (!expiredJobsSnapshot.empty) {
            await batch.commit();
            console.log(`Re-queued ${expiredJobsSnapshot.size} expired jobs.`);
        }
    }
}
exports.QueueService = QueueService;
exports.queueService = new QueueService();
//# sourceMappingURL=queue.service.js.map
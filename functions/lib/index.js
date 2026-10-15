"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectSystemMetrics = exports.cleanupExpiredJobs = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const audit_middleware_1 = require("./middleware/audit.middleware");
const ratelimit_middleware_1 = require("./middleware/ratelimit.middleware");
const storage_service_1 = require("./services/storage.service");
const measurementEngine_1 = require("./services/measurements/measurementEngine");
const measurementStorage_1 = require("./services/measurements/measurementStorage");
const sizeRecommendationEngine_1 = require("./services/sizing/sizeRecommendationEngine");
const queue_service_1 = require("./services/queue.service");
const credit_service_1 = require("./services/credit.service");
const monitoring_service_1 = require("./services/monitoring.service");
const app = (0, express_1.default)();
// Apply global middlewares
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.use(ratelimit_middleware_1.rateLimiter);
/**
 * 1. Storage Upload URL Endpoint
 * Generates a signed URL for direct client uploads to Firebase Storage.
 */
app.post('/upload-url', auth_middleware_1.requireAuth, audit_middleware_1.auditLogger, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { path, contentType } = req.body;
        if (!path || !['raw_uploads', 'vton_assets'].includes(path)) {
            return res.status(400).json({ error: 'Invalid path. Must be raw_uploads or vton_assets.' });
        }
        const result = await storage_service_1.storageService.getUploadUrl(uid, path, contentType || 'image/jpeg');
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * 2. Process Measurements Endpoint
 * Deducts 1 credit, calculates physical body dimensions from raw photos, and saves the profile.
 */
app.post('/measurements', auth_middleware_1.requireAuth, audit_middleware_1.auditLogger, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { frontImageUrl, sideImageUrl, height } = req.body;
        if (!frontImageUrl || !sideImageUrl || !height) {
            return res.status(400).json({ error: 'Missing frontImageUrl, sideImageUrl, or height' });
        }
        const heightCm = parseFloat(height);
        if (isNaN(heightCm) || heightCm <= 0) {
            return res.status(400).json({ error: 'Invalid height value' });
        }
        // Deduct 1 credit for measurement computation
        const creditCost = 1;
        const deductionSuccess = await credit_service_1.creditService.commitCredit(uid, 'DEDUCT_MEASUREMENT', creditCost);
        if (!deductionSuccess) {
            return res.status(402).json({ error: 'Insufficient credits for measurement calculation' });
        }
        try {
            const profile = await (0, measurementEngine_1.processMeasurementImages)(frontImageUrl, sideImageUrl, heightCm);
            await (0, measurementStorage_1.saveMeasurementProfile)(uid, profile);
            return res.status(200).json(profile);
        }
        catch (calcError) {
            // Refund user credits if calculations fail
            await credit_service_1.creditService.refundCredit(uid, creditCost);
            return res.status(500).json({ error: calcError.message || 'Failed to process measurements' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * 3. Recommend Size Endpoint
 * Evaluates chest, waist, and hips measurements against a brand's size chart.
 */
app.post('/sizing', auth_middleware_1.requireAuth, audit_middleware_1.auditLogger, async (req, res) => {
    try {
        const { measurements, sizeChart } = req.body;
        if (!measurements || !sizeChart) {
            return res.status(400).json({ error: 'Missing measurements or sizeChart in body' });
        }
        const recommendation = (0, sizeRecommendationEngine_1.recommendSize)(measurements, sizeChart);
        return res.status(200).json(recommendation);
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * 4. Enqueue Compute Job Endpoint
 * Enqueues a heavy computation job (LLM Chat or VTON) into the Firestore task queue.
 */
app.post('/jobs', auth_middleware_1.requireAuth, audit_middleware_1.auditLogger, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { jobType, payload, priority = 'NORMAL' } = req.body;
        if (!jobType || !['LLM', 'VTON'].includes(jobType)) {
            return res.status(400).json({ error: 'Invalid or missing jobType. Must be LLM or VTON.' });
        }
        if (!payload || typeof payload !== 'object') {
            return res.status(400).json({ error: 'Missing or invalid payload object' });
        }
        // Credit deduction: VTON (2 credits), LLM (1 credit)
        const cost = jobType === 'VTON' ? 2 : 1;
        const action = jobType === 'VTON' ? 'DEDUCT_VTON' : 'DEDUCT_CHAT';
        const deductionSuccess = await credit_service_1.creditService.commitCredit(uid, action, cost);
        if (!deductionSuccess) {
            return res.status(402).json({ error: `Insufficient credits to enqueue ${jobType} job` });
        }
        try {
            const jobId = await queue_service_1.queueService.enqueue(uid, jobType, payload, priority);
            return res.status(202).json({ jobId, status: 'PENDING' });
        }
        catch (queueError) {
            // Refund credits on failure to enqueue
            await credit_service_1.creditService.refundCredit(uid, cost);
            return res.status(500).json({ error: queueError.message || 'Failed to enqueue job' });
        }
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * 5. Get Job Status Endpoint
 * Retrieves current job state (PENDING, PROCESSING, COMPLETED, FAILED) and results.
 */
app.get('/jobs/:jobId', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await queue_service_1.queueService.getJob(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Verify client has permission to view this job (must be job owner)
        const uid = req.user.uid;
        if (job.uid !== uid) {
            return res.status(403).json({ error: 'Forbidden: Cannot access this job data' });
        }
        return res.status(200).json(job);
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
// Export the API under Firebase Functions HTTPS V2 onRequest handler
exports.api = (0, https_1.onRequest)({ cors: true, maxInstances: 10 }, app);
/**
 * 6. Scheduled Cleanup Function
 * Re-queues processing jobs whose worker lease has expired due to heartbeats dropping.
 * Runs every 5 minutes.
 */
exports.cleanupExpiredJobs = (0, scheduler_1.onSchedule)({
    schedule: '*/5 * * * *',
    maxInstances: 1
}, async () => {
    console.log('Sweeping computeQueue for expired worker leases...');
    await queue_service_1.queueService.requeueExpiredJobs();
});
/**
 * 7. Scheduled Telemetry Collection
 * Gathers active worker, VRAM, GPU temperature, and queue latency metrics.
 * Runs every 5 minutes.
 */
exports.collectSystemMetrics = (0, scheduler_1.onSchedule)({
    schedule: '*/5 * * * *',
    maxInstances: 1
}, async () => {
    console.log('Running scheduled system telemetry aggregation...');
    await monitoring_service_1.monitoringService.collectAndStoreMetrics();
});
//# sourceMappingURL=index.js.map
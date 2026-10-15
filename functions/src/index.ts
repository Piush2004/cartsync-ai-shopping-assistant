import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth.middleware';
import { auditLogger } from './middleware/audit.middleware';
import { rateLimiter } from './middleware/ratelimit.middleware';
import { storageService } from './services/storage.service';
import { processMeasurementImages } from './services/measurements/measurementEngine';
import { saveMeasurementProfile } from './services/measurements/measurementStorage';
import { recommendSize } from './services/sizing/sizeRecommendationEngine';
import { queueService } from './services/queue.service';
import { creditService } from './services/credit.service';
import { monitoringService } from './services/monitoring.service';

const app = express();

// Apply global middlewares
app.use(cors({ origin: true }));
app.use(express.json());
app.use(rateLimiter);

/**
 * 1. Storage Upload URL Endpoint
 * Generates a signed URL for direct client uploads to Firebase Storage.
 */
app.post('/upload-url', requireAuth, auditLogger, async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const { path, contentType } = req.body;
    
    if (!path || !['raw_uploads', 'vton_assets'].includes(path)) {
      return res.status(400).json({ error: 'Invalid path. Must be raw_uploads or vton_assets.' });
    }
    
    const result = await storageService.getUploadUrl(uid, path as 'raw_uploads' | 'vton_assets', contentType || 'image/jpeg');
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * 2. Process Measurements Endpoint
 * Deducts 1 credit, calculates physical body dimensions from raw photos, and saves the profile.
 */
app.post('/measurements', requireAuth, auditLogger, async (req, res) => {
  try {
    const uid = (req as any).user.uid;
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
    const deductionSuccess = await creditService.commitCredit(uid, 'DEDUCT_MEASUREMENT', creditCost);
    if (!deductionSuccess) {
      return res.status(402).json({ error: 'Insufficient credits for measurement calculation' });
    }
    
    try {
      const profile = await processMeasurementImages(frontImageUrl, sideImageUrl, heightCm);
      await saveMeasurementProfile(uid, profile);
      return res.status(200).json(profile);
    } catch (calcError: any) {
      // Refund user credits if calculations fail
      await creditService.refundCredit(uid, creditCost);
      return res.status(500).json({ error: calcError.message || 'Failed to process measurements' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * 3. Recommend Size Endpoint
 * Evaluates chest, waist, and hips measurements against a brand's size chart.
 */
app.post('/sizing', requireAuth, auditLogger, async (req, res) => {
  try {
    const { measurements, sizeChart } = req.body;
    
    if (!measurements || !sizeChart) {
      return res.status(400).json({ error: 'Missing measurements or sizeChart in body' });
    }
    
    const recommendation = recommendSize(measurements, sizeChart);
    return res.status(200).json(recommendation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * 4. Enqueue Compute Job Endpoint
 * Enqueues a heavy computation job (LLM Chat or VTON) into the Firestore task queue.
 */
app.post('/jobs', requireAuth, auditLogger, async (req, res) => {
  try {
    const uid = (req as any).user.uid;
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
    
    const deductionSuccess = await creditService.commitCredit(uid, action, cost);
    if (!deductionSuccess) {
      return res.status(402).json({ error: `Insufficient credits to enqueue ${jobType} job` });
    }
    
    try {
      const jobId = await queueService.enqueue(uid, jobType as 'LLM' | 'VTON', payload, priority);
      return res.status(202).json({ jobId, status: 'PENDING' });
    } catch (queueError: any) {
      // Refund credits on failure to enqueue
      await creditService.refundCredit(uid, cost);
      return res.status(500).json({ error: queueError.message || 'Failed to enqueue job' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * 5. Get Job Status Endpoint
 * Retrieves current job state (PENDING, PROCESSING, COMPLETED, FAILED) and results.
 */
app.get('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const jobId = req.params.jobId as string;
    const job = await queueService.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Verify client has permission to view this job (must be job owner)
    const uid = (req as any).user.uid;
    if (job.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden: Cannot access this job data' });
    }
    
    return res.status(200).json(job);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Export the API under Firebase Functions HTTPS V2 onRequest handler
export const api = onRequest({ cors: true, maxInstances: 10 }, app);

/**
 * 6. Scheduled Cleanup Function
 * Re-queues processing jobs whose worker lease has expired due to heartbeats dropping.
 * Runs every 5 minutes.
 */
export const cleanupExpiredJobs = onSchedule({
  schedule: '*/5 * * * *',
  maxInstances: 1
}, async () => {
  console.log('Sweeping computeQueue for expired worker leases...');
  await queueService.requeueExpiredJobs();
});

/**
 * 7. Scheduled Telemetry Collection
 * Gathers active worker, VRAM, GPU temperature, and queue latency metrics.
 * Runs every 5 minutes.
 */
export const collectSystemMetrics = onSchedule({
  schedule: '*/5 * * * *',
  maxInstances: 1
}, async () => {
  console.log('Running scheduled system telemetry aggregation...');
  await monitoringService.collectAndStoreMetrics();
});

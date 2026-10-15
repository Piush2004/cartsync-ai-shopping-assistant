import { db } from '../config/firebase';
import { ComputeJob, JobStatus, JobPriority, JobType } from '../types/queue.types';
import { randomUUID } from 'crypto';

export class QueueService {
  private collectionName = 'computeQueue';

  private get collection() {
    return db.collection(this.collectionName);
  }

  async enqueue(uid: string, jobType: JobType, payload: Record<string, any>, priority: JobPriority = 'NORMAL'): Promise<string> {
    const jobId = randomUUID();
    const job: ComputeJob = {
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

  async getJob(jobId: string): Promise<ComputeJob | null> {
    const doc = await this.collection.doc(jobId).get();
    return doc.exists ? (doc.data() as ComputeJob) : null;
  }

  /**
   * Called by the local compute node to claim a job securely using a transaction.
   */
  async claimJob(jobId: string, workerId: string, leaseDurationMinutes: number = 10): Promise<boolean> {
    const jobRef = this.collection.doc(jobId);
    
    try {
      await db.runTransaction(async (t) => {
        const doc = await t.get(jobRef);
        if (!doc.exists) throw new Error('Job not found');
        
        const job = doc.data() as ComputeJob;
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
    } catch (e) {
      console.warn(`Failed to claim job ${jobId}:`, e);
      return false;
    }
  }

  /**
   * Heartbeat to keep the lease alive.
   */
  async heartbeat(jobId: string, workerId: string, leaseExtensionMinutes: number = 5): Promise<void> {
    const jobRef = this.collection.doc(jobId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(jobRef);
      if (!doc.exists) throw new Error('Job not found');
      
      const job = doc.data() as ComputeJob;
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

  async updateStatus(jobId: string, status: JobStatus, updates?: Partial<ComputeJob>): Promise<void> {
    const dataToUpdate: any = {
      status,
      ...updates
    };

    if (status === 'PROCESSING' && !dataToUpdate.startedAt) {
      dataToUpdate.startedAt = new Date().toISOString();
    }

    await this.collection.doc(jobId).update(dataToUpdate);
  }

  async completeJob(jobId: string, result: any): Promise<void> {
    await this.collection.doc(jobId).update({
      status: 'COMPLETED',
      result,
      completedAt: new Date().toISOString(),
      workerId: null,
      leaseExpiresAt: null
    });
  }

  async failJob(jobId: string, error: string): Promise<void> {
    await this.collection.doc(jobId).update({
      status: 'FAILED',
      error,
      completedAt: new Date().toISOString(),
      workerId: null,
      leaseExpiresAt: null
    });
  }

  async retryJob(jobId: string): Promise<void> {
    const jobRef = this.collection.doc(jobId);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(jobRef);
      if (!doc.exists) {
        throw new Error('Job not found');
      }

      const currentJob = doc.data() as ComputeJob;
      
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

  async cancelJob(jobId: string): Promise<void> {
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
  async requeueExpiredJobs(): Promise<void> {
    const now = new Date().toISOString();
    
    // Note: This requires a composite index on [status, leaseExpiresAt]
    const expiredJobsSnapshot = await this.collection
      .where('status', '==', 'PROCESSING')
      .where('leaseExpiresAt', '<', now)
      .limit(50)
      .get();
      
    const batch = db.batch();
    
    expiredJobsSnapshot.docs.forEach(doc => {
      const job = doc.data() as ComputeJob;
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

export const queueService = new QueueService();

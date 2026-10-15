import { queueService } from '../services/queue.service';
import { db } from '../config/firebase';

export class VtonAgent {
  /**
   * Enqueues a Virtual Try-On (VTON) task on the computeQueue and polls for completion.
   * Conforms to the architecture: agents must not directly call models.
   */
  async runTryOn(uid: string, personImageUrl: string, garmentImageUrl: string, category: string): Promise<any> {
    console.log(`[VtonAgent] Enqueuing try-on task for user ${uid} (category: ${category})...`);
    
    // Enqueue job in computeQueue
    const jobId = await queueService.enqueue(
      uid,
      'VTON',
      { uid, personImageUrl, garmentImageUrl, category },
      'NORMAL'
    );
    
    // Poll Firestore document for status COMPLETED/FAILED
    const maxAttempts = 40;
    const pollIntervalMs = 500;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
      const jobDoc = await db.collection('computeQueue').doc(jobId).get();
      if (!jobDoc.exists) continue;
      
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

export const vtonAgent = new VtonAgent();

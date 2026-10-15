import { queueService } from '../services/queue.service';
import { db } from '../config/firebase';

export class AvatarAgent {
  /**
   * Enqueues an avatar generation task on the computeQueue and polls for completion.
   * Conforms to the architecture: agents must not directly call models.
   */
  async generateAvatar(uid: string): Promise<any> {
    console.log(`[AvatarAgent] Enqueuing avatar creation task for user ${uid}...`);
    
    // Enqueue job in computeQueue
    const jobId = await queueService.enqueue(
      uid,
      'AVATAR',
      { uid },
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
        throw new Error(`Avatar generation failed: ${job.error || 'Unknown error'}`);
      }
    }
    
    throw new Error("Avatar generation request timed out. Please check local compute connection.");
  }
}

export const avatarAgent = new AvatarAgent();
